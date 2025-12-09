import { SeatMapService } from '../src/services/seat-map.service';
import { NotFoundError, ValidationError } from '../src/utils/errors';

const prismaMock = {
  event: { findFirst: jest.fn() },
  venue: { findFirst: jest.fn() },
  seatMap: { upsert: jest.fn(), findUnique: jest.fn() },
  seat: { findMany: jest.fn() },
  seatReservation: { findMany: jest.fn() },
};

jest.mock('../src/config/database', () => ({
  prisma: prismaMock,
}));

describe('SeatMapService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('upsertSeatMap', () => {
    const layout = { sections: [] };

    it('throws when event not found for organizer', async () => {
      prismaMock.event.findFirst.mockResolvedValue(null);

      await expect(
        SeatMapService.upsertSeatMap('org-1', { eventId: 'evt-1', layout }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws when venue not found for organizer', async () => {
      prismaMock.event.findFirst.mockResolvedValue({ id: 'evt-1', organizerId: 'org-1' });
      prismaMock.venue.findFirst.mockResolvedValue(null);

      await expect(
        SeatMapService.upsertSeatMap('org-1', { eventId: 'evt-1', layout, venueId: 'v-1' }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('upserts seat map and generates seats', async () => {
      prismaMock.event.findFirst.mockResolvedValue({ id: 'evt-1', organizerId: 'org-1' });
      prismaMock.venue.findFirst.mockResolvedValue({ id: 'v-1', organizerId: 'org-1' });
      prismaMock.seatMap.upsert.mockResolvedValue({ id: 'sm-1', eventId: 'evt-1' });

      const seatMap = await SeatMapService.upsertSeatMap('org-1', { eventId: 'evt-1', venueId: 'v-1', layout });

      expect(prismaMock.seatMap.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: 'evt-1' },
          data: expect.objectContaining({ eventId: 'evt-1', venueId: 'v-1', layout }),
        }),
      );
      expect(seatMap).toEqual(expect.objectContaining({ id: 'sm-1' }));
    });
  });

  describe('getSeatMapByEventId', () => {
    it('throws when missing', async () => {
      prismaMock.seatMap.findUnique.mockResolvedValue(null);
      await expect(SeatMapService.getSeatMapByEventId('evt-1')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('denies access when organizer mismatches', async () => {
      prismaMock.seatMap.findUnique.mockResolvedValue({
        id: 'sm-1',
        event: { organizerId: 'other-org' },
      });
      await expect(SeatMapService.getSeatMapByEventId('evt-1', 'org-1')).rejects.toBeInstanceOf(ValidationError);
    });
  });
});

