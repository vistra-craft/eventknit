import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import type { Request } from 'express';
import { ProfileService } from '../../../src/services/profile.service.js';
import { NotFoundError } from '../../../src/utils/errors.js';
import * as cloudinaryService from '../../../src/services/cloudinary.service.js';
import * as databaseModule from '../../../src/config/database.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('../../../src/services/cloudinary.service.js');

jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('ProfileService', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeAll(() => {
    prisma = databaseModule.prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe('updateProfileWithAvatar', () => {
    const mockUserId = 'user-123';
    const mockUser = {
      id: mockUserId,
      email: 'user@test.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: null,
      role: UserRole.ATTENDEE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      organizationName: null,
      businessEmail: null,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update profile without file upload', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
        lastName: 'Smith',
      } as any);

      // Act
      const result = await ProfileService.updateProfileWithAvatar(
        mockUserId,
        undefined,
        {
          firstName: 'Jane',
          lastName: 'Smith',
        },
      );

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
        }),
        select: expect.any(Object),
      });
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });

    it('should update profile with file upload', async () => {
      // Arrange
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
      } as NonNullable<Request['file']>;

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (cloudinaryService.uploadImageToCloudinary as jest.Mock).mockResolvedValue({
        secureUrl: 'https://cloudinary.com/avatar.jpg',
      });
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        avatar: 'https://cloudinary.com/avatar.jpg',
      } as any);

      // Act
      const result = await ProfileService.updateProfileWithAvatar(
        mockUserId,
        mockFile,
        {},
      );

      // Assert
      expect(cloudinaryService.uploadImageToCloudinary).toHaveBeenCalledWith(
        mockFile.buffer,
        'user-avatars',
        expect.objectContaining({
          width: 400,
          height: 400,
        }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          avatar: 'https://cloudinary.com/avatar.jpg',
        }),
        select: expect.any(Object),
      });
      expect(result.avatar).toBe('https://cloudinary.com/avatar.jpg');
    });

    it('should update profile with avatar URL', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        avatar: 'https://example.com/avatar.jpg',
      } as any);

      // Act
      const result = await ProfileService.updateProfileWithAvatar(
        mockUserId,
        undefined,
        {
          avatar: 'https://example.com/avatar.jpg',
        },
      );

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          avatar: 'https://example.com/avatar.jpg',
        }),
        select: expect.any(Object),
      });
      expect(result.avatar).toBe('https://example.com/avatar.jpg');
    });

    // NOTE: Email change is now handled via /email/request-change flow.
    // The Joi validation schema strips email before it reaches the service.

    it('should throw error if user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ProfileService.updateProfileWithAvatar(
          'non-existent-user',
          undefined,
          {
            firstName: 'Test',
          },
        ),
      ).rejects.toThrow(NotFoundError);

      await expect(
        ProfileService.updateProfileWithAvatar(
          'non-existent-user',
          undefined,
          {
            firstName: 'Test',
          },
        ),
      ).rejects.toThrow('User not found');
    });

    it('should sanitize input data by trimming strings', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      await ProfileService.updateProfileWithAvatar(
        mockUserId,
        undefined,
        {
          firstName: '  Jane  ',
          lastName: '  Smith  ',
          phoneNumber: '  123-456-7890  ',
        },
      );

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
          phoneNumber: '123-456-7890',
        }),
        select: expect.any(Object),
      });
    });

    it('should convert empty strings to null for optional fields', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);

      // Act
      await ProfileService.updateProfileWithAvatar(
        mockUserId,
        undefined,
        {
          phoneNumber: '  ',
          companyAffiliation: '',
          organizationName: '   ',
        },
      );

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          phoneNumber: null,
          companyAffiliation: null,
          organizationName: null,
        }),
        select: expect.any(Object),
      });
    });

    it('should update firstName without affecting other fields', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue({ ...mockUser, firstName: 'Jane' } as any);

      // Act
      await ProfileService.updateProfileWithAvatar(
        mockUserId,
        undefined,
        {
          firstName: 'Jane',
        },
      );

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { firstName: 'Jane' },
        select: expect.any(Object),
      });
    });
  });

  describe('getProfileById', () => {
    const mockUserId = 'user-123';
    const mockUser = {
      id: mockUserId,
      email: 'user@test.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: null,
      role: UserRole.ATTENDEE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      organizationName: null,
      businessEmail: null,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get user profile by ID', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await ProfileService.getProfileById(mockUserId);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ProfileService.getProfileById('non-existent-user'),
      ).rejects.toThrow(NotFoundError);

      await expect(
        ProfileService.getProfileById('non-existent-user'),
      ).rejects.toThrow('User not found');
    });
  });
});
