import 'reflect-metadata';
import { GET as getConversationsHandler, POST as createConversationHandler } from '@/app/api/conversations/route';
import { prisma } from '@/lib/prisma';
import { initializeDependencyInjection } from '@/lib/di/container';
import { requireUserId } from '@/lib/auth/session';

jest.mock('@/lib/auth/session', () => ({
  requireUserId: jest.fn(),
}));

const MOCK_USER_ID = 'conv_user_123';

beforeAll(() => {
  initializeDependencyInjection();
});

afterEach(async () => {
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();
  jest.clearAllMocks();
});

beforeEach(async () => {
    await prisma.user.create({
        data: {
            id: MOCK_USER_ID,
            email: 'conv@example.com',
            emailLower: 'conv@example.com',
            passwordHash: 'hashed_password',
        },
    });
    (requireUserId as jest.Mock).mockResolvedValue(MOCK_USER_ID);
});

describe.skip('Conversations Integration Tests', () => {
  describe('POST /api/conversations', () => {
    it('should create a new conversation', async () => {
      const mockRequest = {
        json: async () => ({ title: 'Test Conversation' }),
      } as any;

      const response = await createConversationHandler(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.item.title).toBe('Test Conversation');
      expect(data.item.id).toBeDefined();

      const dbConv = await prisma.conversation.findFirst({ where: { userId: MOCK_USER_ID }});
      expect(dbConv).not.toBeNull();
      expect(dbConv?.title).toBe('Test Conversation');
    });
  });

  describe('GET /api/conversations', () => {
    beforeEach(async () => {
        // Create some conversations for the user
        await prisma.conversation.createMany({
            data: [
                { userId: MOCK_USER_ID, title: 'First convo' },
                { userId: MOCK_USER_ID, title: 'Second convo', pinned: true },
                { userId: MOCK_USER_ID, title: 'Third convo with search term' },
            ]
        });
    });

    it('should retrieve a paginated list of conversations', async () => {
        const mockRequest = {
            url: 'http://localhost/api/conversations?page=1&pageSize=2',
        } as any;

        const response = await getConversationsHandler(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.items.length).toBe(2);
        expect(data.total).toBe(3);
        expect(data.totalPages).toBe(2);
        // Pinned conversation should come first
        expect(data.items[0].title).toBe('Second convo');
    });

    it('should filter conversations by a search query', async () => {
        const mockRequest = {
            url: 'http://localhost/api/conversations?q=search term',
        } as any;

        const response = await getConversationsHandler(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.items.length).toBe(1);
        expect(data.items[0].title).toBe('Third convo with search term');
    });
  });
});
