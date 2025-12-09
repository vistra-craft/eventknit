import { EventReviewService } from '../src/services/event-review.service';
import { ValidationError } from '../src/utils/errors';
import { prisma } from '../src/services/event-review.service'; // service uses internal prisma instance

describe('EventReviewService', () => {
  const prismaAny: any = prisma;

  beforeEach(() => {
    prismaAny.eventRegistration = {
      findFirst: jest.fn(),
    };
    prismaAny.event = {
      findUnique: jest.fn(),
    };
    prismaAny.eventReview = {
      upsert: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    };
  });

  it('validates rating range', async () => {
    prismaAny.eventRegistration.findFirst.mockResolvedValue({ id: 'reg-1', checkedInAt: null });
    prismaAny.event.findUnique.mockResolvedValue({ endDate: new Date() });
    await expect(
      EventReviewService.createOrUpdateReview('user-1', 'evt-1', { rating: 6 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('requires confirmed registration', async () => {
    prismaAny.eventRegistration.findFirst.mockResolvedValue(null);
    await expect(
      EventReviewService.createOrUpdateReview('user-1', 'evt-1', { rating: 4 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('creates or updates review and refreshes rating', async () => {
    prismaAny.eventRegistration.findFirst.mockResolvedValue({ id: 'reg-1', checkedInAt: new Date() });
    prismaAny.event.findUnique.mockResolvedValue({ endDate: new Date() });
    prismaAny.eventReview.upsert.mockResolvedValue({ id: 'rev-1' });
    prismaAny.eventReview.aggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: 2 });

    const review = await EventReviewService.createOrUpdateReview('user-1', 'evt-1', { rating: 5, review: 'Great' });
    expect(review).toEqual({ id: 'rev-1' });
    expect(prismaAny.eventReview.upsert).toHaveBeenCalled();
  });

  it('gets reviews with stats', async () => {
    prismaAny.eventReview.findMany.mockResolvedValue([{ id: 'rev-1', rating: 5 }]);
    prismaAny.eventReview.count.mockResolvedValue(1);
    prismaAny.eventReview.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: 1 });

    const res = await EventReviewService.getEventReviews('evt-1');
    expect(res.reviews).toHaveLength(1);
    expect(res.averageRating).toBe(5);
    expect(res.total).toBe(1);
  });

  it('increments helpful count', async () => {
    prismaAny.eventReview.update.mockResolvedValue({ id: 'rev-1', helpfulCount: 1 });
    const review = await EventReviewService.markReviewHelpful('rev-1', 'user-2');
    expect(review.helpfulCount).toBe(1);
  });
});

