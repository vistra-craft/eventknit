import { UnifiedMessagingService } from '../src/services/unified-messaging.service';
import { NotFoundError } from '../src/utils/errors';

const prismaMock = {
  conversation: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('../src/config/database', () => ({
  prisma: prismaMock,
}));

describe('UnifiedMessagingService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates conversation when absent', async () => {
    prismaMock.conversation.findFirst.mockResolvedValue(null);
    prismaMock.conversation.create.mockResolvedValue({ id: 'conv-1' });
    prismaMock.message.create.mockResolvedValue({ id: 'msg-1' });

    const result = await UnifiedMessagingService.sendMessage({
      senderId: 'user-1',
      recipientId: 'user-2',
      content: 'hello',
    });

    expect(prismaMock.conversation.create).toHaveBeenCalled();
    expect(prismaMock.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderId: 'user-1',
          recipientId: 'user-2',
          content: 'hello',
          conversationId: 'conv-1',
        }),
      }),
    );
    expect(result).toEqual(expect.objectContaining({ id: 'msg-1' }));
  });

  it('throws when fetching missing conversation', async () => {
    prismaMock.conversation.findFirst.mockResolvedValue(null);
    await expect(
      UnifiedMessagingService.getConversation('conv-x', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

