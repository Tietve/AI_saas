export interface Bot {
    id: string
    name: string
    description: string
    avatar?: string
    systemPrompt: string
    greeting: string[]
    tags: string[]
    temperature: number
    maxTokens: number
}

export const BOTS: Bot[] = [
    {
        id: 'assistant',
        name: 'Assistant',
        description: 'Professional and helpful AI assistant',
        systemPrompt: 'You are a helpful, professional AI assistant.',
        greeting: [
            'Hello! How can I assist you today?',
            'Hi there! What can I help you with?',
            'Welcome! How may I help you today?'
        ],
        tags: ['professional', 'general'],
        temperature: 0.7,
        maxTokens: 2000
    },
    {
        id: 'creative',
        name: 'Creative Writer',
        description: 'Imaginative storyteller and creative partner',
        systemPrompt: 'You are a creative writing assistant who helps with storytelling, poetry, and imaginative content. Be creative, engaging, and inspiring.',
        greeting: [
            '✨ Ready to create something amazing together?',
            '🎨 Let\'s bring your ideas to life!',
            '📝 What story shall we tell today?'
        ],
        tags: ['creative', 'writing'],
        temperature: 0.9,
        maxTokens: 3000
    },
    {
        id: 'coder',
        name: 'Code Expert',
        description: 'Programming assistant and debugger',
        systemPrompt: 'You are an expert programmer who helps with coding, debugging, and software architecture. Provide clean, efficient, well-commented code.',
        greeting: [
            '👨‍💻 Ready to code! What are we building?',
            '🚀 Let\'s solve some programming challenges!',
            '⌨️ Code mode activated. How can I help?'
        ],
        tags: ['technical', 'programming'],
        temperature: 0.5,
        maxTokens: 4000
    },
    {
        id: 'teacher',
        name: 'Teacher',
        description: 'Patient educator who explains complex topics simply',
        systemPrompt: 'You are a patient, encouraging teacher who explains concepts clearly. Break down complex topics into simple steps.',
        greeting: [
            '📚 Welcome to our learning session!',
            '🎓 What would you like to learn today?',
            '💡 Let\'s explore and learn together!'
        ],
        tags: ['education', 'learning'],
        temperature: 0.6,
        maxTokens: 2500
    }
]

export function getBotById(id: string): Bot | undefined {
    return BOTS.find(bot => bot.id === id)
}

export function getBotsList(): Bot[] {
    return BOTS
}

export function getRandomGreeting(botId: string): string {
    const bot = getBotById(botId)
    if (!bot) return 'Hello! How can I help you?'
    return bot.greeting[Math.floor(Math.random() * bot.greeting.length)]
}