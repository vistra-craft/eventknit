import { UnifiedMessagingService } from '../src/services/unified-messaging.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

vi.mock('../src/config/database', () => ({
  prisma: {
    directMessage: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  directMessage: {
    create: vi.Mock;
    findMany: vi.Mock;
  };
};

describe('UnifiedMessagingService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates direct message', async () => {
    prismaMock.directMessage.create.mockResolvedValue({ id: 'msg-1' });

    const result = await UnifiedMessagingService.sendMessage({
      senderId: 'user-1',
      recipientId: 'user-2',
      content: 'hello',
    });

    expect(prismaMock.directMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderId: 'user-1',
          recipientId: 'user-2',
          content: 'hello',
        }),
      }),
    );
    expect(result).toEqual(expect.objectContaining({ id: 'msg-1' }));
  });

  it('throws when fetching missing conversation', async () => {
    prismaMock.directMessage.findMany.mockResolvedValue([]);
    await expect(
      UnifiedMessagingService.getConversation('conv-x', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

