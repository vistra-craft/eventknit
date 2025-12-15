import { UnifiedMessagingService } from '../src/services/unified-messaging.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

jest.mock('../src/config/database', () => ({
  prisma: {
    directMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  directMessage: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
};

describe('UnifiedMessagingService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
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

