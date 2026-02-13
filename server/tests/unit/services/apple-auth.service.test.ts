import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { AppleAuthService } from '../../../src/services/apple-auth.service.js';
import { AuthenticationError, ValidationError } from '../../../src/utils/errors.js';
import * as jwt from '../../../src/utils/jwt.js';
import * as databaseModule from '../../../src/config/database.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('apple-signin-auth', () => ({
  __esModule: true,
  default: {
    verifyIdToken: jest.fn(),
  },
  verifyIdToken: jest.fn(),
}));

jest.mock('../../../src/utils/jwt.js');
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../src/utils/password.js', () => ({
  ...jest.requireActual('../../../src/utils/password.js'),
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  checkPasswordBreach: jest.fn(),
  // hashToken uses real implementation (pure SHA-256, no side effects)
}));

jest.mock('../../../src/config/index.js', () => ({
  config: {
    apple: {
      clientId: 'com.test.eventknit.web',
      teamId: 'TEST_TEAM_ID',
      keyId: 'TEST_KEY_ID',
      privateKeyPath: './keys/test.p8',
    },
    jwt: {
      expiresIn: '1h',
    },
    security: {
      maxLoginAttempts: 5,
      lockoutDuration: 15,
    },
  },
}));

jest.mock('../../../src/services/email.service.js', () => ({
  emailService: {
    sendVerificationCode: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
    sendAccountInvitation: jest.fn(),
  },
}));

jest.mock('../../../src/utils/audit.js', () => ({
  createAuditLog: jest.fn(),
  AuditActions: {
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  },
}));

// Get reference to the mocked function
import appleSignIn from 'apple-signin-auth';
const mockVerifyIdToken = appleSignIn.verifyIdToken as jest.Mock;

describe('AppleAuthService', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeAll(() => {
    prisma = databaseModule.prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe('verifyAppleIdToken', () => {
    it('should verify valid ID token successfully', async () => {
      // Arrange
      const mockIdToken = 'valid-apple-id-token';
      const mockTokenData = {
        iss: 'https://appleid.apple.com',
        aud: 'com.test.eventknit.web',
        sub: 'apple-user-001.abc123',
        email: 'user@icloud.com',
        email_verified: 'true',
        is_private_email: 'false',
        nonce: 'test-nonce',
        nonce_supported: true,
      };

      mockVerifyIdToken.mockResolvedValue(mockTokenData);

      // Act
      const result = await AppleAuthService.verifyAppleIdToken(mockIdToken);

      // Assert
      expect(result).toEqual({
        id: 'apple-user-001.abc123',
        email: 'user@icloud.com',
        emailVerified: true,
        isPrivateEmail: false,
      });

      expect(mockVerifyIdToken).toHaveBeenCalledWith(mockIdToken, {
        audience: 'com.test.eventknit.web',
        ignoreExpiration: false,
      });
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      mockVerifyIdToken.mockRejectedValue(new Error('invalid token'));

      // Act & Assert
      await expect(
        AppleAuthService.verifyAppleIdToken('invalid-token'),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AppleAuthService.verifyAppleIdToken('invalid-token'),
      ).rejects.toThrow('Failed to verify Apple token');
    });

    it('should throw error when token issuer is not Apple', async () => {
      // Arrange
      const mockTokenData = {
        iss: 'https://malicious-site.com',
        aud: 'com.test.eventknit.web',
        sub: 'apple-user-001',
        email: 'user@icloud.com',
        email_verified: 'true',
        is_private_email: 'false',
      };

      mockVerifyIdToken.mockResolvedValue(mockTokenData);

      // Act & Assert
      await expect(
        AppleAuthService.verifyAppleIdToken('token-wrong-issuer'),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AppleAuthService.verifyAppleIdToken('token-wrong-issuer'),
      ).rejects.toThrow('Invalid Apple token');
    });

    it('should throw error when token audience does not match client ID', async () => {
      // Arrange
      const mockTokenData = {
        iss: 'https://appleid.apple.com',
        aud: 'com.other.app',
        sub: 'apple-user-001',
        email: 'user@icloud.com',
        email_verified: 'true',
        is_private_email: 'false',
      };

      mockVerifyIdToken.mockResolvedValue(mockTokenData);

      // Act & Assert
      await expect(
        AppleAuthService.verifyAppleIdToken('token-wrong-audience'),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AppleAuthService.verifyAppleIdToken('token-wrong-audience'),
      ).rejects.toThrow('Invalid Apple token');
    });

    it('should throw error when token has no sub', async () => {
      // Arrange
      const mockTokenData = {
        iss: 'https://appleid.apple.com',
        aud: 'com.test.eventknit.web',
        email: 'user@icloud.com',
        email_verified: 'true',
        is_private_email: 'false',
        // Missing sub
      };

      mockVerifyIdToken.mockResolvedValue(mockTokenData);

      // Act & Assert
      await expect(
        AppleAuthService.verifyAppleIdToken('token-no-sub'),
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw error when Apple account has no email', async () => {
      // Arrange
      const mockTokenData = {
        iss: 'https://appleid.apple.com',
        aud: 'com.test.eventknit.web',
        sub: 'apple-user-001',
        email_verified: 'true',
        is_private_email: 'false',
        // Missing email
      };

      mockVerifyIdToken.mockResolvedValue(mockTokenData);

      // Act & Assert
      await expect(
        AppleAuthService.verifyAppleIdToken('token-no-email'),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AppleAuthService.verifyAppleIdToken('token-no-email'),
      ).rejects.toThrow('Apple account does not have an email');
    });

    it('should handle email_verified as boolean true', async () => {
      // Arrange
      const mockTokenData = {
        iss: 'https://appleid.apple.com',
        aud: 'com.test.eventknit.web',
        sub: 'apple-user-001',
        email: 'user@icloud.com',
        email_verified: true,
        is_private_email: false,
      };

      mockVerifyIdToken.mockResolvedValue(mockTokenData);

      // Act
      const result = await AppleAuthService.verifyAppleIdToken('valid-token');

      // Assert
      expect(result.emailVerified).toBe(true);
      expect(result.isPrivateEmail).toBe(false);
    });

    it('should handle private relay email', async () => {
      // Arrange
      const mockTokenData = {
        iss: 'https://appleid.apple.com',
        aud: 'com.test.eventknit.web',
        sub: 'apple-user-001',
        email: 'abc123@privaterelay.appleid.com',
        email_verified: 'true',
        is_private_email: 'true',
      };

      mockVerifyIdToken.mockResolvedValue(mockTokenData);

      // Act
      const result = await AppleAuthService.verifyAppleIdToken('valid-token');

      // Assert
      expect(result.email).toBe('abc123@privaterelay.appleid.com');
      expect(result.isPrivateEmail).toBe(true);
    });
  });

  describe('authenticateWithApple', () => {
    const mockAppleTokenData = {
      iss: 'https://appleid.apple.com',
      aud: 'com.test.eventknit.web',
      sub: 'apple-001.abc123',
      email: 'newuser@icloud.com',
      email_verified: 'true',
      is_private_email: 'false',
    };

    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };

    beforeEach(() => {
      (jwt.generateAccessToken as jest.Mock).mockReturnValue(mockTokens.accessToken);
      (jwt.generateRefreshToken as jest.Mock).mockReturnValue(mockTokens.refreshToken);
      (jwt.parseExpiresIn as jest.Mock).mockReturnValue(mockTokens.expiresIn);
    });

    it('should create new user for first-time Apple login', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);

      prisma.user.findFirst.mockResolvedValue(null);

      const mockCreatedUser = {
        id: 'user-new-123',
        email: mockAppleTokenData.email,
        appleId: mockAppleTokenData.sub,
        firstName: 'John',
        lastName: 'Doe',
        otherName: null,
        companyAffiliation: null,
        avatar: null,
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        organizationName: null,
        verificationLevel: null,
      };

      prisma.user.create.mockResolvedValue(mockCreatedUser as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      const result = await AppleAuthService.authenticateWithApple(
        'valid-id-token',
        UserRole.ATTENDEE,
        { name: { firstName: 'John', lastName: 'Doe' } },
        '127.0.0.1',
        'Test User Agent',
      );

      // Assert
      expect(result.user).toEqual({
        id: mockCreatedUser.id,
        email: mockCreatedUser.email,
        firstName: mockCreatedUser.firstName,
        lastName: mockCreatedUser.lastName,
        otherName: mockCreatedUser.otherName,
        companyAffiliation: mockCreatedUser.companyAffiliation,
        role: mockCreatedUser.role,
        status: mockCreatedUser.status,
        isEmailVerified: mockCreatedUser.isEmailVerified,
        organizationName: mockCreatedUser.organizationName,
        verificationLevel: mockCreatedUser.verificationLevel,
      });

      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
      expect(result.expiresIn).toBe(mockTokens.expiresIn);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockAppleTokenData.email,
          appleId: mockAppleTokenData.sub,
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        }),
      });

      // Token saved via AuthService.saveRefreshToken (uses upsert + hashing)
      expect(prisma.refreshToken.upsert).toHaveBeenCalledWith({
        where: { token: expect.any(String) },
        create: expect.objectContaining({
          userId: mockCreatedUser.id,
          token: expect.any(String),
          ipAddress: '127.0.0.1',
          userAgent: 'Test User Agent',
        }),
        update: expect.any(Object),
      });
    });

    it('should login existing user with Apple account', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);

      const mockExistingUser = {
        id: 'user-existing-123',
        email: mockAppleTokenData.email,
        appleId: mockAppleTokenData.sub,
        firstName: 'Existing',
        lastName: 'User',
        otherName: null,
        companyAffiliation: null,
        avatar: 'https://existing-avatar.jpg',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: null,
        verificationLevel: null,
      };

      prisma.user.findFirst.mockResolvedValue(mockExistingUser as any);
      prisma.user.update.mockResolvedValue(mockExistingUser as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      const result = await AppleAuthService.authenticateWithApple('valid-id-token');

      // Assert
      expect(result.user.id).toBe(mockExistingUser.id);
      expect(result.user.email).toBe(mockExistingUser.email);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockExistingUser.id },
        data: expect.objectContaining({
          lastLoginAt: expect.any(Date),
          failedLoginAttempts: 0,
          lockedUntil: null,
        }),
      });

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should link Apple account to existing email user', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);

      const mockExistingUser = {
        id: 'user-existing-123',
        email: mockAppleTokenData.email,
        appleId: null, // No Apple ID yet
        firstName: 'Existing',
        lastName: 'User',
        otherName: null,
        companyAffiliation: null,
        avatar: null,
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: null,
        verificationLevel: null,
      };

      prisma.user.findFirst.mockResolvedValue(mockExistingUser as any);
      prisma.user.update.mockResolvedValue({
        ...mockExistingUser,
        appleId: mockAppleTokenData.sub,
      } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await AppleAuthService.authenticateWithApple('valid-id-token');

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockExistingUser.id },
        data: expect.objectContaining({
          appleId: mockAppleTokenData.sub,
          lastLoginAt: expect.any(Date),
        }),
      });
    });

    it('should use name from userData for new users (Apple first auth)', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await AppleAuthService.authenticateWithApple(
        'valid-id-token',
        UserRole.ATTENDEE,
        { name: { firstName: 'Jane', lastName: 'Smith' } },
      );

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
        }),
      });
    });

    it('should handle missing name for new users (subsequent Apple auth)', async () => {
      // Apple only sends name on first authorization
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await AppleAuthService.authenticateWithApple(
        'valid-id-token',
        UserRole.ATTENDEE,
        undefined, // No user data
      );

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: null,
          lastName: null,
        }),
      });
    });

    it('should respect ATTENDEE role for new users', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user', role: UserRole.ATTENDEE } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await AppleAuthService.authenticateWithApple(
        'valid-token',
        UserRole.ATTENDEE,
      );

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.ATTENDEE,
        }),
      });
    });

    it('should respect ORGANIZER role for new users', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user', role: UserRole.ORGANIZER } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await AppleAuthService.authenticateWithApple(
        'valid-token',
        UserRole.ORGANIZER,
      );

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.ORGANIZER,
        }),
      });
    });

    it('should throw error for invalid role (ADMIN) during registration', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);
      prisma.user.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AppleAuthService.authenticateWithApple(
          'valid-token',
          'ADMIN' as UserRole,
        ),
      ).rejects.toThrow(ValidationError);

      await expect(
        AppleAuthService.authenticateWithApple(
          'valid-token',
          'ADMIN' as UserRole,
        ),
      ).rejects.toThrow('Invalid role. Only ATTENDEE or ORGANIZER roles are allowed during registration.');
    });

    it('should mark email as verified for Apple users', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await AppleAuthService.authenticateWithApple('valid-token');

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isEmailVerified: true,
          emailVerifiedAt: expect.any(Date),
        }),
      });
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const mixedCaseTokenData = {
        ...mockAppleTokenData,
        email: 'MixedCase@iCloud.COM',
      };
      mockVerifyIdToken.mockResolvedValue(mixedCaseTokenData);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await AppleAuthService.authenticateWithApple('valid-token');

      // Assert
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { appleId: mockAppleTokenData.sub },
            { email: 'mixedcase@icloud.com' },
          ],
        },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'mixedcase@icloud.com',
        }),
      });
    });

    it('should throw error for SUSPENDED user', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);

      const mockSuspendedUser = {
        id: 'suspended-user',
        email: mockAppleTokenData.email,
        appleId: mockAppleTokenData.sub,
        status: UserStatus.SUSPENDED,
      };

      prisma.user.findFirst.mockResolvedValue(mockSuspendedUser as any);

      // Act & Assert
      await expect(
        AppleAuthService.authenticateWithApple('valid-token'),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AppleAuthService.authenticateWithApple('valid-token'),
      ).rejects.toThrow('Your account has been suspended. Please contact support');
    });

    it('should handle private relay email for new users', async () => {
      // Arrange
      const privateRelayTokenData = {
        ...mockAppleTokenData,
        email: 'abc123@privaterelay.appleid.com',
        is_private_email: 'true',
      };
      mockVerifyIdToken.mockResolvedValue(privateRelayTokenData);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await AppleAuthService.authenticateWithApple('valid-token');

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'abc123@privaterelay.appleid.com',
        }),
      });
    });

    it('should handle missing Apple account email', async () => {
      // Arrange
      const noEmailTokenData = {
        iss: 'https://appleid.apple.com',
        aud: 'com.test.eventknit.web',
        sub: 'apple-001',
        email_verified: 'true',
        is_private_email: 'false',
        // Missing email
      };
      mockVerifyIdToken.mockResolvedValue(noEmailTokenData);

      // Act & Assert — verifyAppleIdToken should throw before authenticateWithApple processes
      await expect(
        AppleAuthService.authenticateWithApple('valid-token'),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        AppleAuthService.authenticateWithApple('valid-token'),
      ).rejects.toThrow('Apple account does not have an email');
    });

    it('should generate and save refresh token with IP and user agent', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);

      prisma.user.findFirst.mockResolvedValue({
        id: 'user-123',
        status: UserStatus.ACTIVE,
        appleId: mockAppleTokenData.sub,
      } as any);
      prisma.user.update.mockResolvedValue({} as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      const testIp = '192.168.1.100';
      const testUserAgent = 'Mozilla/5.0';

      // Act
      await AppleAuthService.authenticateWithApple(
        'valid-token',
        undefined,
        undefined,
        testIp,
        testUserAgent,
      );

      // Assert — uses upsert via AuthService.saveRefreshToken (with hashing)
      expect(prisma.refreshToken.upsert).toHaveBeenCalledWith({
        where: { token: expect.any(String) },
        create: expect.objectContaining({
          ipAddress: testIp,
          userAgent: testUserAgent,
          expiresAt: expect.any(Date),
        }),
        update: expect.any(Object),
      });
    });

    it('should default to ATTENDEE role when no role provided', async () => {
      // Arrange
      mockVerifyIdToken.mockResolvedValue(mockAppleTokenData);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await AppleAuthService.authenticateWithApple('valid-token');

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.ATTENDEE,
        }),
      });
    });
  });
});
