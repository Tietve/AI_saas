
import { ModelId } from '@prisma/client'


export const MODEL_PROVIDER_MAP: Record<ModelId, string> = {
    
    gpt_4_turbo: 'gpt-4-turbo-preview',
    gpt_4o: 'gpt-4o',
    gpt_4o_mini: 'gpt-4o-mini',
    gpt_3_5_turbo: 'gpt-3.5-turbo',
    "gpt_5_nano": 'gpt-5-nano',


    
    claude_3_opus: 'claude-3-opus-20240229',
    claude_3_5_sonnet: 'claude-3-5-sonnet-20241022',
    claude_3_5_haiku: 'claude-3-5-haiku-20241022',

    
    gemini_1_5_pro: 'gemini-1.5-pro',
    gemini_1_5_flash: 'gemini-1.5-flash',
    gemini_2_0_flash: 'gemini-2.0-flash-exp',

    
    gpt5_thinking: 'gpt-4o',
    gpt5_mini: 'gpt-4o-mini',
    gpt4o_mini: 'gpt-4o-mini',
}


export const ALLOWED_MODELS = Object.keys(MODEL_PROVIDER_MAP) as ModelId[]


export const DEFAULT_MODEL_ID: ModelId = ModelId.gpt_4o_mini


export function defaultModel(): ModelId {
    return DEFAULT_MODEL_ID
}


export interface ModelDisplay {
    id: ModelId
    label: string
    provider: 'openai' | 'anthropic' | 'google'
    costTier: 'cheap' | 'standard' | 'premium'
    capabilities: {
        text: boolean
        images: boolean
        audio: boolean
        tools: boolean
        search: boolean
    }
}

export const MODELS_DISPLAY: ModelDisplay[] = [
    
    {
        id: ModelId.gpt_4o_mini,
        label: 'GPT-4o Mini (Fast & Cheap)',
        provider: 'openai',
        costTier: 'cheap',
        capabilities: { text: true, images: true, audio: false, tools: true, search: false }
    },
    {
        id: ModelId.gpt_4o,
        label: 'GPT-4o (Standard)',
        provider: 'openai',
        costTier: 'standard',
        capabilities: { text: true, images: true, audio: true, tools: true, search: false }
    },
    {
        id: ModelId.gpt_4_turbo,
        label: 'GPT-4 Turbo (Advanced)',
        provider: 'openai',
        costTier: 'premium',
        capabilities: { text: true, images: true, audio: false, tools: true, search: false }
    },

    {
        id: ModelId.gpt_5_nano,
        label: 'GPT-5 Nano (Ultra Fast & Cheap)',
        provider: 'openai',
        costTier: 'cheap',
        capabilities: { text: true, images: true, audio: false, tools: true, search: false }
    },
    {
        id: ModelId.claude_3_5_haiku,
        label: 'Claude 3.5 Haiku (Fast)',
        provider: 'anthropic',
        costTier: 'cheap',
        capabilities: { text: true, images: true, audio: false, tools: true, search: false }
    },
    {
        id: ModelId.claude_3_5_sonnet,
        label: 'Claude 3.5 Sonnet (Balanced)',
        provider: 'anthropic',
        costTier: 'standard',
        capabilities: { text: true, images: true, audio: false, tools: true, search: false }
    },
    {
        id: ModelId.claude_3_opus,
        label: 'Claude 3 Opus (Powerful)',
        provider: 'anthropic',
        costTier: 'premium',
        capabilities: { text: true, images: true, audio: false, tools: true, search: false }
    },

    
    {
        id: ModelId.gemini_1_5_flash,
        label: 'Gemini 1.5 Flash (Fast)',
        provider: 'google',
        costTier: 'cheap',
        capabilities: { text: true, images: true, audio: true, tools: true, search: false }
    },
    {
        id: ModelId.gemini_1_5_pro,
        label: 'Gemini 1.5 Pro (Advanced)',
        provider: 'google',
        costTier: 'standard',
        capabilities: { text: true, images: true, audio: true, tools: true, search: false }
    },
    {
        id: ModelId.gemini_2_0_flash,
        label: 'Gemini 2.0 Flash (Experimental)',
        provider: 'google',
        costTier: 'cheap',
        capabilities: { text: true, images: true, audio: true, tools: true, search: true }
    }
]


export function toProviderModelId(modelId: ModelId): string {
    return MODEL_PROVIDER_MAP[modelId] || MODEL_PROVIDER_MAP[DEFAULT_MODEL_ID]
}


export function cheaperAlternatives(modelId: ModelId): ModelId[] {
    const currentModel = MODELS_DISPLAY.find(m => m.id === modelId)
    if (!currentModel) return []

    
    const alternatives = MODELS_DISPLAY
        .filter(m =>
            m.provider === currentModel.provider &&
            m.costTier === 'cheap' &&
            m.id !== modelId
        )
        .map(m => m.id)

    
    if (alternatives.length === 0) {
        return MODELS_DISPLAY
            .filter(m => m.costTier === 'cheap' && m.id !== modelId)
            .map(m => m.id)
    }

    return alternatives
}


export function isAllowedModel(model: string): model is ModelId {
    return ALLOWED_MODELS.includes(model as ModelId)
}


export function normalizeModel(model?: string | null): ModelId {
    if (!model) return DEFAULT_MODEL_ID

    
    if (isAllowedModel(model)) {
        return model as ModelId
    }

    
    const legacyMappings: Record<string, ModelId> = {
        'gpt-4o-mini': ModelId.gpt_4o_mini,
        'gpt-4o': ModelId.gpt_4o,
        'gpt-4-turbo': ModelId.gpt_4_turbo,
        'claude-3-opus': ModelId.claude_3_opus,
        'claude-3.5-sonnet': ModelId.claude_3_5_sonnet,
        'gemini-pro': ModelId.gemini_1_5_pro,
        'gemini-flash': ModelId.gemini_1_5_flash,
    }

    const mapped = legacyMappings[model.toLowerCase()]
    return mapped || DEFAULT_MODEL_ID
}


export const ALL_MODELS = MODELS_DISPLAY