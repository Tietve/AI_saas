// src/components/chat/shared/constants.ts

import { ModelOption } from './types'

// Storage keys
export const STORAGE_KEY = 'chat_conversations'

export const AVAILABLE_MODELS: ModelOption[] = [
    {
        id: 'gpt_4o_mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        speed: 'lightning',
        contextWindow: '128K',
        bestFor: 'Quick tasks, coding',
        capabilities: ['Fast responses', 'Code generation', 'General chat'],
        pricing: { input: 0.15, output: 0.6 }
    },
    {
        id: 'gpt_4o',
        name: 'GPT-4o',
        provider: 'openai',
        speed: 'fast',
        contextWindow: '128K',
        bestFor: 'Complex reasoning',
        capabilities: ['Advanced reasoning', 'Vision', 'Code review']
    },
    {
        id: 'o1_preview',
        name: 'o1 Preview',
        provider: 'openai',
        speed: 'advanced',
        contextWindow: '128K',
        bestFor: 'Deep analysis',
        capabilities: ['PhD-level reasoning', 'Math', 'Science']
    },
    {
        id: 'o1_mini',
        name: 'o1 Mini',
        provider: 'openai',
        speed: 'balanced',
        contextWindow: '128K',
        bestFor: 'STEM tasks',
        capabilities: ['Math problems', 'Coding', 'Logic']
    },
    {
        id: 'claude_3_5_sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        speed: 'fast',
        contextWindow: '200K',
        bestFor: 'Creative writing',
        capabilities: ['Writing', 'Analysis', 'Vision']
    },
    {
        id: 'claude_3_5_haiku',
        name: 'Claude 3.5 Haiku',
        provider: 'anthropic',
        speed: 'lightning',
        contextWindow: '200K',
        bestFor: 'Quick tasks',
        capabilities: ['Fast responses', 'Summaries', 'Chat']
    },
    {
        id: 'gemini_1_5_pro',
        name: 'Gemini 1.5 Pro',
        provider: 'google',
        speed: 'balanced',
        contextWindow: '2M',
        bestFor: 'Long context',
        capabilities: ['Huge context', 'Multimodal', 'Research']
    },
    {
        id: 'gemini_1_5_flash',
        name: 'Gemini 1.5 Flash',
        provider: 'google',
        speed: 'lightning',
        contextWindow: '1M',
        bestFor: 'Fast multimodal',
        capabilities: ['Quick responses', 'Images', 'Long text']
    },
    {
        id: 'gemini_2_0_flash',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        speed: 'fast',
        contextWindow: '1M',
        bestFor: 'Latest features',
        capabilities: ['Newest model', 'Multimodal', 'Speed']
    }
]

export const PROVIDER_STYLES = {
    openai: {
        gradient: 'from-green-500 to-emerald-600',
        color: 'text-green-600',
        bgLight: 'bg-green-50',
        bgDark: 'dark:bg-green-900/20'
    },
    anthropic: {
        gradient: 'from-orange-500 to-amber-600',
        color: 'text-orange-600',
        bgLight: 'bg-orange-50',
        bgDark: 'dark:bg-orange-900/20'
    },
    google: {
        gradient: 'from-blue-500 to-indigo-600',
        color: 'text-blue-600',
        bgLight: 'bg-blue-50',
        bgDark: 'dark:bg-blue-900/20'
    }
}

export const SPEED_STYLES = {
    lightning: {
        icon: '⚡',
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        label: 'Lightning'
    },
    fast: {
        icon: '🚀',
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        label: 'Fast'
    },
    balanced: {
        icon: '⚙️',
        color: 'text-purple-600',
        bg: 'bg-purple-100',
        label: 'Balanced'
    },
    advanced: {
        icon: '🧠',
        color: 'text-indigo-600',
        bg: 'bg-indigo-100',
        label: 'Advanced'
    }
}