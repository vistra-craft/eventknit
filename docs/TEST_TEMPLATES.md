# EventKnit Server - Test Templates

This document provides reusable templates for creating consistent, comprehensive tests across the EventKnit server.

---

## Table of Contents
1. [Service Test Template](#service-test-template)
2. [Controller Test Template](#controller-test-template)
3. [Job Test Template](#job-test-template)
4. [Integration Test Template](#integration-test-template)
5. [Mock Helpers](#mock-helpers)
6. [Test Data Factories](#test-data-factories)

---

## Service Test Template

Use this template for testing service layer logic.

```typescript
// tests/unit/services/example.service.test.ts

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { ExampleService } from '../../../src/services/example.service.js';
import { AppError } from '../../../src/utils/errors.js';

// Mock Prisma
jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

describe('ExampleService', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let exampleService: ExampleService;

  beforeAll(() => {
    prisma = require('../../../src/config/database.js').default;
  });

  beforeEach(() => {
    mockReset(prisma);
    exampleService = new ExampleService();
  });

  describe('createExample', () => {
    it('should create a new example successfully', async () => {
      // Arrange
      const mockInput = {
        name: 'Test Example',
        description: 'Test description',
        userId: 'user-123',
      };

      const mockCreatedExample = {
        id: 'example-123',
        ...mockInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.example.create.mockResolvedValue(mockCreatedExample);

      // Act
      const result = await exampleService.createExample(mockInput);

      // Assert
      expect(result).toEqual(mockCreatedExample);
      expect(prisma.example.create).toHaveBeenCalledWith({
        data: mockInput,
      });
      expect(prisma.example.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error if user does not exist', async () => {
      // Arrange
      const mockInput = {
        name: 'Test Example',
        description: 'Test description',
        userId: 'invalid-user',
      };

      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(exampleService.createExample(mockInput))
        .rejects
        .toThrow(AppError);

      await expect(exampleService.createExample(mockInput))
        .rejects
        .toThrow('User not found');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockInput = {
        name: 'Test Example',
        description: 'Test description',
        userId: 'user-123',
      };

      prisma.example.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(exampleService.createExample(mockInput))
        .rejects
        .toThrow('Database connection failed');
    });
  });

  describe('getExampleById', () => {
    it('should retrieve example by id', async () => {
      // Arrange
      const mockExample = {
        id: 'example-123',
        name: 'Test Example',
        description: 'Test description',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.example.findUnique.mockResolvedValue(mockExample);

      // Act
      const result = await exampleService.getExampleById('example-123');

      // Assert
      expect(result).toEqual(mockExample);
      expect(prisma.example.findUnique).toHaveBeenCalledWith({
        where: { id: 'example-123' },
      });
    });

    it('should return null if example not found', async () => {
      // Arrange
      prisma.example.findUnique.mockResolvedValue(null);

      // Act
      const result = await exampleService.getExampleById('invalid-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateExample', () => {
    it('should update example successfully', async () => {
      // Arrange
      const mockExistingExample = {
        id: 'example-123',
        name: 'Old Name',
        description: 'Old description',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdateData = {
        name: 'New Name',
        description: 'New description',
      };

      const mockUpdatedExample = {
        ...mockExistingExample,
        ...mockUpdateData,
        updatedAt: new Date(),
      };

      prisma.example.findUnique.mockResolvedValue(mockExistingExample);
      prisma.example.update.mockResolvedValue(mockUpdatedExample);

      // Act
      const result = await exampleService.updateExample('example-123', mockUpdateData);

      // Assert
      expect(result).toEqual(mockUpdatedExample);
      expect(prisma.example.update).toHaveBeenCalledWith({
        where: { id: 'example-123' },
        data: mockUpdateData,
      });
    });

    it('should throw error if example not found', async () => {
      // Arrange
      prisma.example.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(exampleService.updateExample('invalid-id', { name: 'New Name' }))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('deleteExample', () => {
    it('should delete example successfully', async () => {
      // Arrange
      const mockExample = {
        id: 'example-123',
        name: 'Test Example',
        description: 'Test description',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.example.findUnique.mockResolvedValue(mockExample);
      prisma.example.delete.mockResolvedValue(mockExample);

      // Act
      await exampleService.deleteExample('example-123');

      // Assert
      expect(prisma.example.delete).toHaveBeenCalledWith({
        where: { id: 'example-123' },
      });
    });

    it('should throw error if example not found', async () => {
      // Arrange
      prisma.example.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(exampleService.deleteExample('invalid-id'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('listExamples', () => {
    it('should list examples with pagination', async () => {
      // Arrange
      const mockExamples = [
        {
          id: 'example-1',
          name: 'Example 1',
          description: 'Description 1',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'example-2',
          name: 'Example 2',
          description: 'Description 2',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.example.findMany.mockResolvedValue(mockExamples);
      prisma.example.count.mockResolvedValue(2);

      // Act
      const result = await exampleService.listExamples({
        page: 1,
        limit: 10,
        userId: 'user-123',
      });

      // Assert
      expect(result.items).toEqual(mockExamples);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter examples by criteria', async () => {
      // Arrange
      const mockExamples = [
        {
          id: 'example-1',
          name: 'Filtered Example',
          description: 'Description',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.example.findMany.mockResolvedValue(mockExamples);

      // Act
      const result = await exampleService.listExamples({
        name: 'Filtered',
        userId: 'user-123',
      });

      // Assert
      expect(prisma.example.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({
              contains: 'Filtered',
            }),
          }),
        })
      );
    });
  });
});
```

---

## Controller Test Template

Use this template for testing controller/route handlers.

```typescript
// tests/unit/controllers/example.controller.test.ts

import { Request, Response } from 'express';
import { ExampleController } from '../../../src/controllers/example.controller.js';
import { ExampleService } from '../../../src/services/example.service.js';
import { AppError } from '../../../src/utils/errors.js';

// Mock the service
jest.mock('../../../src/services/example.service.js');

describe('ExampleController', () => {
  let exampleService: jest.Mocked<ExampleService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup service mock
    exampleService = new ExampleService() as jest.Mocked<ExampleService>;

    // Setup request mock
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'ATTENDEE',
      },
    };

    // Setup response mock
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Setup next function mock
    next = jest.fn();
  });

  describe('createExample', () => {
    it('should create example and return 201', async () => {
      // Arrange
      const mockInput = {
        name: 'Test Example',
        description: 'Test description',
      };

      const mockCreatedExample = {
        id: 'example-123',
        ...mockInput,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      req.body = mockInput;
      exampleService.createExample = jest.fn().mockResolvedValue(mockCreatedExample);

      // Act
      await ExampleController.createExample(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedExample,
      });
      expect(exampleService.createExample).toHaveBeenCalledWith({
        ...mockInput,
        userId: 'user-123',
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      req.body = { name: '' }; // Invalid input

      const validationError = new AppError('Validation failed', 400);
      exampleService.createExample = jest.fn().mockRejectedValue(validationError);

      // Act
      await ExampleController.createExample(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalledWith(validationError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      req.body = {
        name: 'Test Example',
        description: 'Test description',
      };

      const serviceError = new Error('Service error');
      exampleService.createExample = jest.fn().mockRejectedValue(serviceError);

      // Act
      await ExampleController.createExample(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getExampleById', () => {
    it('should retrieve example by id and return 200', async () => {
      // Arrange
      const mockExample = {
        id: 'example-123',
        name: 'Test Example',
        description: 'Test description',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      req.params = { id: 'example-123' };
      exampleService.getExampleById = jest.fn().mockResolvedValue(mockExample);

      // Act
      await ExampleController.getExampleById(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockExample,
      });
    });

    it('should return 404 if example not found', async () => {
      // Arrange
      req.params = { id: 'invalid-id' };
      exampleService.getExampleById = jest.fn().mockResolvedValue(null);

      // Act
      await ExampleController.getExampleById(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('not found'),
          statusCode: 404,
        })
      );
    });
  });

  describe('listExamples', () => {
    it('should list examples with pagination', async () => {
      // Arrange
      const mockResult = {
        items: [
          {
            id: 'example-1',
            name: 'Example 1',
            description: 'Description 1',
            userId: 'user-123',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      req.query = { page: '1', limit: '10' };
      exampleService.listExamples = jest.fn().mockResolvedValue(mockResult);

      // Act
      await ExampleController.listExamples(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });
  });

  describe('updateExample', () => {
    it('should update example and return 200', async () => {
      // Arrange
      const mockUpdateData = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const mockUpdatedExample = {
        id: 'example-123',
        ...mockUpdateData,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      req.params = { id: 'example-123' };
      req.body = mockUpdateData;
      exampleService.updateExample = jest.fn().mockResolvedValue(mockUpdatedExample);

      // Act
      await ExampleController.updateExample(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedExample,
      });
    });
  });

  describe('deleteExample', () => {
    it('should delete example and return 204', async () => {
      // Arrange
      req.params = { id: 'example-123' };
      exampleService.deleteExample = jest.fn().mockResolvedValue(undefined);

      // Act
      await ExampleController.deleteExample(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
```

---

## Job Test Template

Use this template for testing background jobs/scheduled tasks.

```typescript
// tests/unit/jobs/example.job.test.ts

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { ExampleJob } from '../../../src/jobs/example.job.js';
import { EmailService } from '../../../src/services/email.service.js';
import { logger } from '../../../src/utils/logger.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

jest.mock('../../../src/services/email.service.js');
jest.mock('../../../src/utils/logger.js');

describe('ExampleJob', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let emailService: jest.Mocked<EmailService>;
  let exampleJob: ExampleJob;

  beforeAll(() => {
    prisma = require('../../../src/config/database.js').default;
  });

  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();

    emailService = new EmailService() as jest.Mocked<EmailService>;
    exampleJob = new ExampleJob();
  });

  describe('execute', () => {
    it('should process eligible items successfully', async () => {
      // Arrange
      const mockItems = [
        {
          id: 'item-1',
          name: 'Item 1',
          status: 'PENDING',
          createdAt: new Date(),
        },
        {
          id: 'item-2',
          name: 'Item 2',
          status: 'PENDING',
          createdAt: new Date(),
        },
      ];

      prisma.example.findMany.mockResolvedValue(mockItems);
      prisma.example.update.mockResolvedValue({} as any);
      emailService.sendEmail = jest.fn().mockResolvedValue(undefined);

      // Act
      await exampleJob.execute();

      // Assert
      expect(prisma.example.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
        },
      });

      expect(prisma.example.update).toHaveBeenCalledTimes(2);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('processed successfully')
      );
    });

    it('should handle no eligible items', async () => {
      // Arrange
      prisma.example.findMany.mockResolvedValue([]);

      // Act
      await exampleJob.execute();

      // Assert
      expect(prisma.example.update).not.toHaveBeenCalled();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('No items to process')
      );
    });

    it('should continue processing after individual item failure', async () => {
      // Arrange
      const mockItems = [
        { id: 'item-1', name: 'Item 1', status: 'PENDING' },
        { id: 'item-2', name: 'Item 2', status: 'PENDING' },
        { id: 'item-3', name: 'Item 3', status: 'PENDING' },
      ];

      prisma.example.findMany.mockResolvedValue(mockItems);

      // First item succeeds, second fails, third succeeds
      prisma.example.update
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce({} as any);

      emailService.sendEmail = jest.fn().mockResolvedValue(undefined);

      // Act
      await exampleJob.execute();

      // Assert
      expect(prisma.example.update).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process item'),
        expect.any(Error)
      );
      // Should still process the third item
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
    });

    it('should handle database connection errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      prisma.example.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(exampleJob.execute()).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Job failed'),
        dbError
      );
    });

    it('should respect batch size limits', async () => {
      // Arrange
      const mockItems = Array.from({ length: 150 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        status: 'PENDING',
      }));

      prisma.example.findMany.mockResolvedValue(mockItems);
      prisma.example.update.mockResolvedValue({} as any);

      // Act
      await exampleJob.execute();

      // Assert
      // Should process in batches of 100
      expect(prisma.example.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });
  });

  describe('schedule', () => {
    it('should return correct cron expression', () => {
      // Act
      const cronExpression = exampleJob.getCronExpression();

      // Assert
      expect(cronExpression).toBe('0 */6 * * *'); // Every 6 hours
    });
  });
});
```

---

## Integration Test Template

Use this template for integration tests that test multiple components together.

```typescript
// tests/integration/example-flow.test.ts

import request from 'supertest';
import { app } from '../../src/app.js';
import prisma from '../../src/config/database.js';
import { generateAuthToken } from '../../src/utils/auth.js';

describe('Example Flow Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear relevant tables
    await prisma.example.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'ATTENDEE',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    userId = user.id;
    authToken = generateAuthToken(user);
  });

  describe('Complete Example Workflow', () => {
    it('should create, retrieve, update, and delete example', async () => {
      // Step 1: Create example
      const createResponse = await request(app)
        .post('/api/v1/examples')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Example',
          description: 'Test description',
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data).toHaveProperty('id');
      const exampleId = createResponse.body.data.id;

      // Step 2: Retrieve example
      const getResponse = await request(app)
        .get(`/api/v1/examples/${exampleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.name).toBe('Test Example');

      // Step 3: Update example
      const updateResponse = await request(app)
        .put(`/api/v1/examples/${exampleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Example',
          description: 'Updated description',
        })
        .expect(200);

      expect(updateResponse.body.data.name).toBe('Updated Example');

      // Step 4: List examples
      const listResponse = await request(app)
        .get('/api/v1/examples')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body.data.items).toHaveLength(1);

      // Step 5: Delete example
      await request(app)
        .delete(`/api/v1/examples/${exampleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Step 6: Verify deletion
      await request(app)
        .get(`/api/v1/examples/${exampleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should enforce authorization rules', async () => {
      // Create example as first user
      const createResponse = await request(app)
        .post('/api/v1/examples')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Example',
          description: 'Test description',
        })
        .expect(201);

      const exampleId = createResponse.body.data.id;

      // Create second user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: 'hashedPassword123',
          role: 'ATTENDEE',
          firstName: 'Other',
          lastName: 'User',
        },
      });

      const otherToken = generateAuthToken(otherUser);

      // Try to update as different user (should fail)
      await request(app)
        .put(`/api/v1/examples/${exampleId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          name: 'Unauthorized Update',
        })
        .expect(403);

      // Try to delete as different user (should fail)
      await request(app)
        .delete(`/api/v1/examples/${exampleId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should handle validation errors properly', async () => {
      // Missing required fields
      await request(app)
        .post('/api/v1/examples')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing name field',
        })
        .expect(400);

      // Invalid field types
      await request(app)
        .post('/api/v1/examples')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 123, // Should be string
          description: 'Invalid name type',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      // No auth token
      await request(app)
        .post('/api/v1/examples')
        .send({
          name: 'Test Example',
          description: 'Test description',
        })
        .expect(401);

      // Invalid auth token
      await request(app)
        .get('/api/v1/examples')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
```

---

## Mock Helpers

Common mock utilities to use across tests.

```typescript
// tests/helpers/mocks.ts

import { User, Role } from '@prisma/client';

export const mockUser = (overrides?: Partial<User>): User => ({
  id: 'user-123',
  email: 'test@example.com',
  password: 'hashedPassword',
  role: 'ATTENDEE' as Role,
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: null,
  dateOfBirth: null,
  profilePicture: null,
  bio: null,
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockAuthRequest = (user?: Partial<User>) => ({
  user: mockUser(user),
  headers: {
    authorization: 'Bearer mock-token',
  },
});

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = () => jest.fn();

export const mockPaginationQuery = () => ({
  page: 1,
  limit: 10,
});

export const mockDateRange = () => ({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-12-31'),
});
```

---

## Test Data Factories

Reusable factory functions for creating test data.

```typescript
// tests/helpers/factories.ts

import { faker } from '@faker-js/faker';

export const EventFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    title: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    startDate: faker.date.future(),
    endDate: faker.date.future(),
    location: faker.location.city(),
    category: 'CONFERENCE',
    status: 'PUBLISHED',
    capacity: faker.number.int({ min: 50, max: 500 }),
    organizerId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  buildMany: (count: number, overrides = {}) => {
    return Array.from({ length: count }, () => EventFactory.build(overrides));
  },
};

export const TicketFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    eventId: faker.string.uuid(),
    name: `${faker.commerce.productAdjective()} Ticket`,
    description: faker.commerce.productDescription(),
    price: faker.number.float({ min: 10, max: 500, precision: 0.01 }),
    quantity: faker.number.int({ min: 10, max: 100 }),
    availableQuantity: faker.number.int({ min: 5, max: 100 }),
    type: 'STANDARD',
    salesStartDate: faker.date.past(),
    salesEndDate: faker.date.future(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  buildMany: (count: number, overrides = {}) => {
    return Array.from({ length: count }, () => TicketFactory.build(overrides));
  },
};

export const RegistrationFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    eventId: faker.string.uuid(),
    ticketId: faker.string.uuid(),
    status: 'CONFIRMED',
    attendeeName: faker.person.fullName(),
    attendeeEmail: faker.internet.email(),
    qrCode: faker.string.alphanumeric(20),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

export const UserFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: 'ATTENDEE',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phoneNumber: faker.phone.number(),
    isVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};
```

---

## Best Practices

### 1. Test Structure (AAA Pattern)
Always organize tests with Arrange, Act, Assert:
```typescript
it('should do something', async () => {
  // Arrange - Setup test data and mocks
  const mockData = { ... };
  service.method.mockResolvedValue(mockData);

  // Act - Execute the code under test
  const result = await controller.method(req, res, next);

  // Assert - Verify the results
  expect(result).toEqual(expected);
});
```

### 2. Test Naming
Use descriptive test names that explain the scenario:
- ✅ `should create event when valid data is provided`
- ✅ `should throw error when user is not authorized`
- ❌ `test1`
- ❌ `should work`

### 3. Mock Only External Dependencies
- Mock database (Prisma)
- Mock external APIs (Stripe, email services)
- Mock file system operations
- Don't mock the code you're testing

### 4. Test Edge Cases
Always test:
- Happy path
- Error cases
- Boundary conditions
- Null/undefined values
- Empty arrays/objects
- Invalid input types

### 5. Use Factories for Test Data
Prefer factories over hardcoded values:
```typescript
// ✅ Good
const event = EventFactory.build({ capacity: 100 });

// ❌ Avoid
const event = {
  id: 'event-123',
  title: 'Test Event',
  // ... 20 more fields
};
```

### 6. Keep Tests Independent
Each test should be able to run in isolation:
```typescript
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  // Clear test data
  mockReset(prisma);
});
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- example.service.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run only unit tests
npm test -- --testPathPattern="unit"

# Run only integration tests
npm test -- --testPathPattern="integration"
```

---

*Use these templates as starting points and adapt them to your specific needs!*
