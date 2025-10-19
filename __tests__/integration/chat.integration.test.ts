import 'reflect-metadata';
import { POST as chatHandler } from '@/app/api/chat/route';
import { prisma } from '@/lib/prisma';
import { initializeDependencyInjection } from '@/lib/di/container';
import { requireUserId } from '@/lib/auth/session';
import { MultiProviderGateway } from '@/lib/ai-providers/multi-provider-gateway';
import { getSemanticCache, SemanticCache } from '@/lib/cache/semantic-cache';

jest.mock('@/lib/auth/session', () => ({
  requireUserId: jest.fn(),
}));

jest.mock('@/lib/ai-providers/multi-provider-gateway');
jest.mock('@/lib/cache/semantic-cache');

const MOCK_USER_ID = 'chat_user_123';
const MOCK_CONVERSATION_ID = 'chat_conv_123';

beforeAll(() => {
  initializeDependencyInjection();
});

afterEach(async () => {
  await prisma.tokenUsage.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();
  jest.clearAllMocks();
});

beforeEach(async () => {
    await prisma.user.create({
        data: {
            id: MOCK_USER_ID,
            email: 'chat@example.com',
            emailLower: 'chat@example.com',
            passwordHash: 'hashed_password',
            monthlyTokenUsed: 100,
        },
    });
    await prisma.conversation.create({
        data: {
            id: MOCK_CONVERSATION_ID,
            userId: MOCK_USER_ID,
            title: 'Chat Test',
        }
    });
    (requireUserId as jest.Mock).mockResolvedValue(MOCK_USER_ID);
});

describe.skip('Chat API Integration Tests', () => {

    const mockGatewayResponse = {
        content: 'This is an AI response.',
        provider: 'mock-provider',
        model: 'mock-model',
        usage: { promptTokens: 10, completionTokens: 20, totalCost: 0.001 },
    };

    const mockCache = {
        findSimilar: jest.fn(),
        set: jest.fn(),
    };

    beforeEach(() => {
        (MultiProviderGateway as jest.Mock).mockImplementation(() => ({
            routeRequest: jest.fn().mockResolvedValue(mockGatewayResponse),
        }));
        (getSemanticCache as jest.Mock).mockReturnValue(mockCache);
    });

    it('should process a message, save it to DB, and update token usage', async () => {
        mockCache.findSimilar.mockResolvedValue(null); // Cache miss

        const mockRequest = {
            json: async () => ({
                message: 'Hello AI',
                conversationId: MOCK_CONVERSATION_ID,
            }),
        } as any;

        const response = await chatHandler(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.content).toBe(mockGatewayResponse.content);
        expect(data.fromCache).toBeUndefined();

        // Verify DB state
        const messages = await prisma.message.findMany({ where: { conversationId: MOCK_CONVERSATION_ID } });
        expect(messages.length).toBe(2);
        expect(messages.find(m => m.role === 'USER')?.content).toBe('Hello AI');
        expect(messages.find(m => m.role === 'ASSISTANT')?.content).toBe(mockGatewayResponse.content);

        const tokenUsage = await prisma.tokenUsage.findFirst({ where: { userId: MOCK_USER_ID }});
        expect(tokenUsage).not.toBeNull();
        expect(tokenUsage?.tokensIn).toBe(10);
        expect(tokenUsage?.tokensOut).toBe(20);

        const user = await prisma.user.findUnique({ where: { id: MOCK_USER_ID } });
        expect(user?.monthlyTokenUsed).toBe(100 + 10 + 20);
    });

    it('should return a cached response if a similar query is found', async () => {
        const cachedResponse = {
            response: 'This is a cached response.',
            tokensIn: 5,
            tokensOut: 15,
            model: 'cached-model',
        };
        mockCache.findSimilar.mockResolvedValue(cachedResponse);

        const mockRequest = {
            json: async () => ({
                message: 'A very similar message',
                conversationId: MOCK_CONVERSATION_ID,
            }),
        } as any;

        const response = await chatHandler(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.content).toBe(cachedResponse.response);
        expect(data.fromCache).toBe(true);

        // Verify nothing was written to DB
        const messages = await prisma.message.findMany({ where: { conversationId: MOCK_CONVERSATION_ID } });
        expect(messages.length).toBe(0); // No new messages

        const user = await prisma.user.findUnique({ where: { id: MOCK_USER_ID } });
        expect(user?.monthlyTokenUsed).toBe(100); // Unchanged
    });
});
