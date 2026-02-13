import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import axios from 'axios';
import { GoogleAuthService } from '../../../src/services/google-auth.service.js';
import { AuthenticationError, ValidationError } from '../../../src/utils/errors.js';
import * as jwt from '../../../src/utils/jwt.js';
import * as databaseModule from '../../../src/config/database.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('axios', () => {
  const mockGet = jest.fn();
  const mockIsAxiosError = jest.fn();
  return {
    default: {
      get: mockGet,
      isAxiosError: mockIsAxiosError,
    },
    get: mockGet,
    isAxiosError: mockIsAxiosError,
  };
});

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
    google: {
      clientId: 'test-google-client-id',
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

// Get references to the mocked functions
const mockAxiosGet = axios.get as jest.Mock;
const mockAxiosIsAxiosError = axios.isAxiosError as unknown as jest.Mock;

describe('GoogleAuthService', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeAll(() => {
    prisma = databaseModule.prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
    mockAxiosIsAxiosError.mockReturnValue(false);
  });

  describe('verifyGoogleIdToken', () => {
    it('should verify valid ID token successfully', async () => {
      // Arrange
      const mockIdToken = 'valid-google-id-token';
      const mockTokenInfo = {
        aud: 'test-google-client-id',
        sub: 'google-user-123',
        email: 'test@gmail.com',
        email_verified: 'true',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/photo.jpg',
      };

      mockAxiosGet.mockResolvedValue({ data: mockTokenInfo });

      // Act
      const result = await GoogleAuthService.verifyGoogleIdToken(mockIdToken);

      // Assert
      expect(result).toEqual({
        id: 'google-user-123',
        email: 'test@gmail.com',
        verified_email: true,
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/photo.jpg',
      });

      expect(mockAxiosGet).toHaveBeenCalledWith(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${mockIdToken}`,
      );
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      const mockInvalidToken = 'invalid-token';

      mockAxiosGet.mockRejectedValue({
        isAxiosError: true,
        response: { data: { error: 'invalid_token' } },
      });

      mockAxiosIsAxiosError.mockReturnValue(true);

      // Act & Assert
      await expect(
        GoogleAuthService.verifyGoogleIdToken(mockInvalidToken),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        GoogleAuthService.verifyGoogleIdToken(mockInvalidToken),
      ).rejects.toThrow('Failed to verify Google token');
    });

    it('should throw error when token audience does not match client ID', async () => {
      // Arrange
      const mockIdToken = 'token-wrong-audience';
      const mockTokenInfo = {
        aud: 'some-other-app-client-id',
        sub: 'google-user-123',
        email: 'test@gmail.com',
        email_verified: 'true',
      };

      mockAxiosGet.mockResolvedValue({ data: mockTokenInfo });

      // Act & Assert
      await expect(
        GoogleAuthService.verifyGoogleIdToken(mockIdToken),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        GoogleAuthService.verifyGoogleIdToken(mockIdToken),
      ).rejects.toThrow('Invalid Google token');
    });

    it('should throw error when token verification returns no sub', async () => {
      // Arrange
      const mockIdToken = 'token-without-sub';
      const mockTokenInfo = {
        aud: 'test-google-client-id',
        email: 'test@gmail.com',
        email_verified: 'true',
        // Missing sub field
      };

      mockAxiosGet.mockResolvedValue({ data: mockTokenInfo });

      // Act & Assert
      await expect(
        GoogleAuthService.verifyGoogleIdToken(mockIdToken),
      ).rejects.toThrow(AuthenticationError);
    });

    it('should handle email_verified as false', async () => {
      // Arrange
      const mockIdToken = 'valid-token';
      const mockTokenInfo = {
        aud: 'test-google-client-id',
        sub: 'google-user-123',
        email: 'test@gmail.com',
        email_verified: 'false',
        name: 'Test User',
      };

      mockAxiosGet.mockResolvedValue({ data: mockTokenInfo });

      // Act
      const result = await GoogleAuthService.verifyGoogleIdToken(mockIdToken);

      // Assert
      expect(result.verified_email).toBe(false);
    });
  });

  describe('verifyGoogleAccessToken', () => {
    it('should verify valid access token', async () => {
      // Arrange
      const mockAccessToken = 'valid-access-token';
      const mockUserData = {
        id: 'google-user-456',
        email: 'user@gmail.com',
        verified_email: true,
        name: 'Google User',
        given_name: 'Google',
        family_name: 'User',
        picture: 'https://example.com/avatar.jpg',
      };

      mockAxiosGet.mockResolvedValue({ data: mockUserData });

      // Act
      const result = await GoogleAuthService.verifyGoogleAccessToken(mockAccessToken);

      // Assert
      expect(result).toEqual(mockUserData);
      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        },
      );
    });

    it('should throw error for invalid access token', async () => {
      // Arrange
      const mockInvalidToken = 'invalid-access-token';

      mockAxiosGet.mockRejectedValue({
        isAxiosError: true,
        response: { data: { error: 'invalid_token' } },
      });

      mockAxiosIsAxiosError.mockReturnValue(true);

      // Act & Assert
      await expect(
        GoogleAuthService.verifyGoogleAccessToken(mockInvalidToken),
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw error when Google account has no email', async () => {
      // Arrange
      const mockAccessToken = 'token-no-email';
      const mockUserData = {
        id: 'google-user-789',
        name: 'No Email User',
        // Missing email field
      };

      mockAxiosGet.mockResolvedValue({ data: mockUserData });

      // Act & Assert
      await expect(
        GoogleAuthService.verifyGoogleAccessToken(mockAccessToken),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        GoogleAuthService.verifyGoogleAccessToken(mockAccessToken),
      ).rejects.toThrow('Google account does not have an email');
    });
  });

  describe('authenticateWithGoogle', () => {
    const mockGoogleUser = {
      id: 'google-123',
      email: 'newuser@gmail.com',
      verified_email: true,
      name: 'New User',
      given_name: 'New',
      family_name: 'User',
      picture: 'https://example.com/photo.jpg',
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

    it('should create new user for first-time Google login with ID token', async () => {
      // Arrange
      mockAxiosGet.mockResolvedValue({ data: {
        aud: 'test-google-client-id',
        sub: mockGoogleUser.id,
        email: mockGoogleUser.email,
        email_verified: 'true',
        name: mockGoogleUser.name,
        given_name: mockGoogleUser.given_name,
        family_name: mockGoogleUser.family_name,
        picture: mockGoogleUser.picture,
      } });

      prisma.user.findFirst.mockResolvedValue(null);

      const mockCreatedUser = {
        id: 'user-new-123',
        email: mockGoogleUser.email,
        googleId: mockGoogleUser.id,
        firstName: 'New',
        lastName: 'User',
        otherName: null,
        companyAffiliation: null,
        avatar: mockGoogleUser.picture,
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
      const result = await GoogleAuthService.authenticateWithGoogle(
        'valid-id-token',
        'id_token',
        UserRole.ATTENDEE,
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
          email: mockGoogleUser.email,
          googleId: mockGoogleUser.id,
          firstName: 'New',
          lastName: 'User',
          avatar: mockGoogleUser.picture,
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        }),
      });

      // Token is now saved via AuthService.saveRefreshToken (uses upsert + hashing)
      expect(prisma.refreshToken.upsert).toHaveBeenCalledWith({
        where: { token: expect.any(String) }, // hashed token
        create: expect.objectContaining({
          userId: mockCreatedUser.id,
          token: expect.any(String), // hashed token
          ipAddress: '127.0.0.1',
          userAgent: 'Test User Agent',
        }),
        update: expect.any(Object),
      });
    });

    it('should login existing user with Google account', async () => {
      // Arrange
      mockAxiosGet.mockResolvedValue({ data: mockGoogleUser });

      const mockExistingUser = {
        id: 'user-existing-123',
        email: mockGoogleUser.email,
        googleId: mockGoogleUser.id,
        firstName: 'Existing',
        lastName: 'User',
        otherName: null,
        companyAffiliation: null,
        avatar: 'https://old-avatar.jpg',
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
      const result = await GoogleAuthService.authenticateWithGoogle(
        'valid-access-token',
        'access_token',
      );

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

    it('should link Google account to existing email user', async () => {
      // Arrange
      mockAxiosGet.mockResolvedValue({ data: {
        aud: 'test-google-client-id',
        sub: 'google-new-123',
        email: mockGoogleUser.email,
        email_verified: 'true',
        name: mockGoogleUser.name,
      } });

      const mockExistingUser = {
        id: 'user-existing-123',
        email: mockGoogleUser.email,
        googleId: null, // No Google ID yet
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
        googleId: 'google-new-123',
      } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      const _result = await GoogleAuthService.authenticateWithGoogle('valid-id-token');

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockExistingUser.id },
        data: expect.objectContaining({
          googleId: 'google-new-123',
          lastLoginAt: expect.any(Date),
        }),
      });
    });

    it('should update avatar if user has none and Google provides one', async () => {
      // Arrange
      mockAxiosGet.mockResolvedValue({ data: mockGoogleUser });

      const mockExistingUser = {
        id: 'user-123',
        email: mockGoogleUser.email,
        googleId: mockGoogleUser.id,
        firstName: 'User',
        lastName: 'Name',
        avatar: null, // No avatar
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      };

      prisma.user.findFirst.mockResolvedValue(mockExistingUser as any);
      prisma.user.update.mockResolvedValue({
        ...mockExistingUser,
        avatar: mockGoogleUser.picture,
      } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await GoogleAuthService.authenticateWithGoogle('valid-access-token', 'access_token');

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockExistingUser.id },
        data: expect.objectContaining({
          avatar: mockGoogleUser.picture,
        }),
      });
    });

    it('should NOT update avatar if user already has one', async () => {
      // Arrange
      mockAxiosGet.mockResolvedValue({ data: mockGoogleUser });

      const mockExistingUser = {
        id: 'user-123',
        email: mockGoogleUser.email,
        googleId: mockGoogleUser.id,
        firstName: 'User',
        lastName: 'Name',
        avatar: 'https://existing-avatar.jpg', // Has avatar
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      };

      prisma.user.findFirst.mockResolvedValue(mockExistingUser as any);
      prisma.user.update.mockResolvedValue(mockExistingUser as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await GoogleAuthService.authenticateWithGoogle('valid-access-token', 'access_token');

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockExistingUser.id },
        data: expect.not.objectContaining({
          avatar: expect.anything(),
        }),
      });
    });

    it('should respect ATTENDEE role for new users', async () => {
      // Arrange
      mockAxiosGet.mockResolvedValue({ data: {
        aud: 'test-google-client-id',
        sub: mockGoogleUser.id,
        email: mockGoogleUser.email,
        email_verified: 'true',
      } });

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user', role: UserRole.ATTENDEE } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await GoogleAuthService.authenticateWithGoogle(
        'valid-token',
        'id_token',
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
      mockAxiosGet.mockResolvedValue({ data: {
        aud: 'test-google-client-id',
        sub: mockGoogleUser.id,
        email: mockGoogleUser.email,
        email_verified: 'true',
      } });

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user', role: UserRole.ORGANIZER } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await GoogleAuthService.authenticateWithGoogle(
        'valid-token',
        'id_token',
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
      const mockTokenInfo = {
        aud: 'test-google-client-id',
        sub: 'google-123',
        email: 'newuser@gmail.com',
        email_verified: 'true',
        name: 'New User',
        given_name: 'New',
        family_name: 'User',
        picture: 'https://example.com/photo.jpg',
      };

      mockAxiosGet.mockResolvedValue({ data: mockTokenInfo });

      prisma.user.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        GoogleAuthService.authenticateWithGoogle(
          'valid-token',
          'id_token',
          'ADMIN' as UserRole,
        ),
      ).rejects.toThrow(ValidationError);

      await expect(
        GoogleAuthService.authenticateWithGoogle(
          'valid-token',
          'id_token',
          'ADMIN' as UserRole,
        ),
      ).rejects.toThrow('Invalid role. Only ATTENDEE or ORGANIZER roles are allowed during registration.');
    });

    it('should mark email as verified for Google users', async () => {
      // Arrange
      mockAxiosGet.mockResolvedValue({ data: {
        aud: 'test-google-client-id',
        sub: mockGoogleUser.id,
        email: mockGoogleUser.email,
        email_verified: 'true',
      } });

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await GoogleAuthService.authenticateWithGoogle('valid-token');

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
      mockAxiosGet.mockResolvedValue({ data: {
        aud: 'test-google-client-id',
        sub: mockGoogleUser.id,
        email: 'MixedCase@Gmail.COM',
        email_verified: 'true',
      } });

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await GoogleAuthService.authenticateWithGoogle('valid-token');

      // Assert
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { googleId: mockGoogleUser.id },
            { email: 'mixedcase@gmail.com' },
          ],
        },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'mixedcase@gmail.com',
        }),
      });
    });

    it('should throw error for SUSPENDED user', async () => {
      // Arrange
      const mockTokenInfo = {
        aud: 'test-google-client-id',
        sub: 'google-123',
        email: 'suspended@gmail.com',
        email_verified: 'true',
        name: 'Suspended User',
      };

      mockAxiosGet.mockResolvedValue({ data: mockTokenInfo });

      const mockSuspendedUser = {
        id: 'suspended-user',
        email: 'suspended@gmail.com',
        googleId: 'google-123',
        status: UserStatus.SUSPENDED,
      };

      prisma.user.findFirst.mockResolvedValue(mockSuspendedUser as any);

      // Act & Assert
      await expect(
        GoogleAuthService.authenticateWithGoogle('valid-token'),
      ).rejects.toThrow(AuthenticationError);

      await expect(
        GoogleAuthService.authenticateWithGoogle('valid-token'),
      ).rejects.toThrow('Your account has been suspended. Please contact support');
    });

    it('should parse name correctly when only full name provided', async () => {
      // Arrange
      mockAxiosGet.mockResolvedValue({ data: {
        aud: 'test-google-client-id',
        sub: 'google-123',
        email: 'user@gmail.com',
        email_verified: 'true',
        name: 'John Michael Doe',
        // No given_name or family_name
      } });

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      // Act
      await GoogleAuthService.authenticateWithGoogle('valid-token');

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'John',
          lastName: 'Michael Doe',
        }),
      });
    });

    it('should handle missing Google account email', async () => {
      // Arrange
      mockAxiosGet.mockResolvedValue({ data: {
        aud: 'test-google-client-id',
        sub: 'google-123',
        // Missing email
        email_verified: 'true',
      } });

      // Act & Assert
      await expect(
        GoogleAuthService.authenticateWithGoogle('valid-token'),
      ).rejects.toThrow(ValidationError);

      await expect(
        GoogleAuthService.authenticateWithGoogle('valid-token'),
      ).rejects.toThrow('Google account does not have an email address');
    });

    it('should generate and save refresh token with IP and user agent', async () => {
      // Arrange
      mockAxiosGet.mockResolvedValue({ data: mockGoogleUser });

      prisma.user.findFirst.mockResolvedValue({
        id: 'user-123',
        status: UserStatus.ACTIVE,
      } as any);
      prisma.user.update.mockResolvedValue({} as any);
      prisma.refreshToken.upsert.mockResolvedValue({} as any);

      const testIp = '192.168.1.100';
      const testUserAgent = 'Mozilla/5.0';

      // Act
      await GoogleAuthService.authenticateWithGoogle(
        'valid-token',
        'access_token',
        undefined,
        testIp,
        testUserAgent,
      );

      // Assert — now uses upsert via AuthService.saveRefreshToken (with hashing)
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
  });
});
