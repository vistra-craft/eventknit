/**
 * Survey Service Unit Tests
 *
 * Follows EventKnit testing conventions:
 * - vitest-mock-extended for Prisma mocking
 * - AAA pattern (Arrange → Act → Assert)
 * - Test behavior, not implementation
 * - Services throw typed errors (ValidationError, NotFoundError, AuthorizationError)
 * - .js extensions in mock paths (ESM)
 */

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { SurveyService } from '../../../src/services/survey.service.js';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '../../../src/utils/errors.js';
import * as databaseModule from '../../../src/config/database.js';

vi.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('SurveyService', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = databaseModule.prisma as unknown as DeepMockProxy<PrismaClient>;
    mockReset(prisma);
    vi.clearAllMocks();
  });

  const organizerId = 'organizer-123';
  const eventId = 'event-456';
  const surveyId = 'survey-789';
  const attendeeId = 'attendee-abc';

  const mockEvent = {
    id: eventId,
    organizerId,
    isManaged: false,
    managedByAdminId: null,
  };

  const mockSurvey = {
    id: surveyId,
    eventId,
    createdById: organizerId,
    title: 'Event Feedback Survey',
    description: null,
    includeNps: true,
    includeVenueRating: true,
    includeSpeakerRating: false,
    includeContentRating: false,
    includeOrgRating: false,
    includeValueRating: false,
    customQuestions: [],
    triggerAfterHours: 24,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // ===========================================================================
  // createSurvey
  // ===========================================================================

  describe('createSurvey', () => {
    it('should create a survey with default settings', async () => {
      // Arrange
      prisma.event.findUnique.mockResolvedValue(mockEvent as any);
      prisma.eventSurvey.findUnique.mockResolvedValue(null); // No existing survey
      prisma.eventSurvey.create.mockResolvedValue(mockSurvey as any);

      // Act
      const result = await SurveyService.createSurvey(organizerId, { eventId });

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(surveyId);
      expect(prisma.eventSurvey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventId,
            createdById: organizerId,
            title: 'Event Feedback Survey',
          }),
        }),
      );
    });

    it('should create a survey with custom questions', async () => {
      // Arrange
      const customQuestions = [
        { id: 'q1', question: 'Favorite session?', type: 'multiple_choice' as const, options: ['A', 'B', 'C'] },
        { id: 'q2', question: 'Suggestions?', type: 'text' as const },
      ];
      prisma.event.findUnique.mockResolvedValue(mockEvent as any);
      prisma.eventSurvey.findUnique.mockResolvedValue(null);
      prisma.eventSurvey.create.mockResolvedValue({ ...mockSurvey, customQuestions } as any);

      // Act
      const result = await SurveyService.createSurvey(organizerId, {
        eventId,
        customQuestions,
        includeNps: true,
        title: 'Post-Event Survey',
      });

      // Assert
      expect(result).toBeDefined();
      expect(prisma.eventSurvey.create).toHaveBeenCalled();
    });

    it('should throw NotFoundError when event does not exist', async () => {
      // Arrange
      prisma.event.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        SurveyService.createSurvey(organizerId, { eventId }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when survey already exists', async () => {
      // Arrange
      prisma.event.findUnique.mockResolvedValue(mockEvent as any);
      prisma.eventSurvey.findUnique.mockResolvedValue(mockSurvey as any);

      // Act & Assert
      await expect(
        SurveyService.createSurvey(organizerId, { eventId }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when more than 5 custom questions', async () => {
      // Arrange
      prisma.event.findUnique.mockResolvedValue(mockEvent as any);
      const tooMany = Array.from({ length: 6 }, (_, i) => ({
        id: `q${i}`, question: `Q${i}`, type: 'text' as const,
      }));

      // Act & Assert
      await expect(
        SurveyService.createSurvey(organizerId, { eventId, customQuestions: tooMany }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when multiple choice has fewer than 2 options', async () => {
      // Arrange
      prisma.event.findUnique.mockResolvedValue(mockEvent as any);
      const bad = [{ id: 'q1', question: 'Pick one', type: 'multiple_choice' as const, options: ['Only'] }];

      // Act & Assert
      await expect(
        SurveyService.createSurvey(organizerId, { eventId, customQuestions: bad }),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ===========================================================================
  // updateSurvey
  // ===========================================================================

  describe('updateSurvey', () => {
    it('should update survey settings', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue({
        ...mockSurvey,
        event: mockEvent,
      } as any);
      prisma.eventSurvey.update.mockResolvedValue({
        ...mockSurvey,
        includeNps: true,
        title: 'Updated Title',
      } as any);

      // Act
      const result = await SurveyService.updateSurvey(surveyId, organizerId, {
        title: 'Updated Title',
        includeNps: true,
      });

      // Assert
      expect(result.title).toBe('Updated Title');
      expect(prisma.eventSurvey.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: surveyId } }),
      );
    });

    it('should throw NotFoundError when survey does not exist', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        SurveyService.updateSurvey(surveyId, organizerId, { title: 'X' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ===========================================================================
  // deleteSurvey
  // ===========================================================================

  describe('deleteSurvey', () => {
    it('should delete a survey with no responses', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue({
        ...mockSurvey,
        event: { organizerId, isManaged: false, managedByAdminId: null },
        _count: { responses: 0 },
      } as any);
      prisma.eventSurvey.delete.mockResolvedValue(mockSurvey as any);

      // Act
      await SurveyService.deleteSurvey(surveyId, organizerId);

      // Assert
      expect(prisma.eventSurvey.delete).toHaveBeenCalledWith({ where: { id: surveyId } });
    });

    it('should throw ValidationError when survey has responses', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue({
        ...mockSurvey,
        event: { organizerId, isManaged: false, managedByAdminId: null },
        _count: { responses: 5 },
      } as any);

      // Act & Assert
      await expect(SurveyService.deleteSurvey(surveyId, organizerId)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when survey does not exist', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(SurveyService.deleteSurvey(surveyId, organizerId)).rejects.toThrow(NotFoundError);
    });
  });

  // ===========================================================================
  // submitResponse
  // ===========================================================================

  describe('submitResponse', () => {
    const validResponse = {
      surveyId,
      eventId,
      overallRating: 4,
      npsScore: 8,
      venueRating: 5,
      comment: 'Great event!',
    };

    it('should submit a valid response', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue(mockSurvey as any);
      prisma.eventRegistration.findFirst.mockResolvedValue({ id: 'reg-1' } as any);
      prisma.surveyResponse.upsert.mockResolvedValue({
        id: 'response-1',
        ...validResponse,
        attendeeId,
      } as any);

      // Act
      const result = await SurveyService.submitResponse(attendeeId, validResponse);

      // Assert
      expect(result).toBeDefined();
      expect(prisma.surveyResponse.upsert).toHaveBeenCalled();
    });

    it('should throw NotFoundError when survey does not exist', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        SurveyService.submitResponse(attendeeId, validResponse),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when survey is inactive', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue({ ...mockSurvey, isActive: false } as any);

      // Act & Assert
      await expect(
        SurveyService.submitResponse(attendeeId, validResponse),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when overall rating is out of range', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue(mockSurvey as any);

      // Act & Assert
      await expect(
        SurveyService.submitResponse(attendeeId, { ...validResponse, overallRating: 6 }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when NPS score is out of range', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue(mockSurvey as any);

      // Act & Assert
      await expect(
        SurveyService.submitResponse(attendeeId, { ...validResponse, npsScore: 11 }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw AuthorizationError when attendee is not registered', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue(mockSurvey as any);
      prisma.eventRegistration.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        SurveyService.submitResponse(attendeeId, validResponse),
      ).rejects.toThrow(AuthorizationError);
    });
  });

  // ===========================================================================
  // hasResponded
  // ===========================================================================

  describe('hasResponded', () => {
    it('should return true when response exists', async () => {
      // Arrange
      prisma.surveyResponse.findUnique.mockResolvedValue({ id: 'resp-1' } as any);

      // Act
      const result = await SurveyService.hasResponded(surveyId, attendeeId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when no response exists', async () => {
      // Arrange
      prisma.surveyResponse.findUnique.mockResolvedValue(null);

      // Act
      const result = await SurveyService.hasResponded(surveyId, attendeeId);

      // Assert
      expect(result).toBe(false);
    });
  });

  // ===========================================================================
  // getSurveyResults
  // ===========================================================================

  describe('getSurveyResults', () => {
    it('should return aggregated results with averages', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue({
        ...mockSurvey,
        _count: { responses: 3 },
      } as any);
      prisma.surveyResponse.findMany.mockResolvedValue([
        { overallRating: 5, npsScore: 9, venueRating: 4, speakerRating: null, contentRating: null, orgRating: null, valueRating: null, customAnswers: {}, comment: 'Amazing', submittedAt: new Date(), attendee: { id: '1', firstName: 'A', lastName: 'B', avatar: null } },
        { overallRating: 4, npsScore: 7, venueRating: 3, speakerRating: null, contentRating: null, orgRating: null, valueRating: null, customAnswers: {}, comment: 'Good', submittedAt: new Date(), attendee: { id: '2', firstName: 'C', lastName: 'D', avatar: null } },
        { overallRating: 3, npsScore: 5, venueRating: 5, speakerRating: null, contentRating: null, orgRating: null, valueRating: null, customAnswers: {}, comment: null, submittedAt: new Date(), attendee: { id: '3', firstName: 'E', lastName: 'F', avatar: null } },
      ] as any);

      // Act
      const results = await SurveyService.getSurveyResults(eventId);

      // Assert
      expect(results.totalResponses).toBe(3);
      expect(results.averages.overall).toBe(4); // (5+4+3)/3
      expect(results.averages.venue).toBe(4); // (4+3+5)/3
      expect(results.npsBreakdown).toBeDefined();
      expect(results.npsBreakdown!.promoters).toBe(1); // score 9
      expect(results.npsBreakdown!.detractors).toBe(1); // score 5
      expect(results.npsBreakdown!.passives).toBe(1); // score 7
      expect(results.responses).toHaveLength(3);
    });

    it('should return empty results when no responses exist', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue({
        ...mockSurvey,
        _count: { responses: 0 },
      } as any);
      prisma.surveyResponse.findMany.mockResolvedValue([]);

      // Act
      const results = await SurveyService.getSurveyResults(eventId);

      // Assert
      expect(results.totalResponses).toBe(0);
      expect(results.npsBreakdown).toBeNull();
      expect(results.responses).toHaveLength(0);
    });

    it('should throw NotFoundError when no survey exists', async () => {
      // Arrange
      prisma.eventSurvey.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(SurveyService.getSurveyResults(eventId)).rejects.toThrow(NotFoundError);
    });
  });
});
