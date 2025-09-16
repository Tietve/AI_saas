// src/lib/ai/models.ts

/** Danh sách model cho phép (đồng bộ với BE & FE) */
export const ALLOWED_MODELS = [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4.1-mini',
    'gpt-4.1',
] as const

export type AllowedModel = typeof ALLOWED_MODELS[number]

/** Model mặc định */
export const DEFAULT_MODEL_ID: AllowedModel = 'gpt-4o-mini'

/** Danh sách để hiển thị (label/costTier tuỳ chỉnh theo bạn) */
export const MODELS_DISPLAY: Array<{ id: AllowedModel; label: string; costTier: 'cheap'|'standard'|'premium' }> = [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini (nhanh & rẻ)', costTier: 'cheap' },
    { id: 'gpt-4o',      label: 'GPT-4o (chuẩn)',          costTier: 'standard' },
    { id: 'gpt-4.1-mini',label: 'GPT-4.1 Mini',            costTier: 'cheap' },
    { id: 'gpt-4.1',     label: 'GPT-4.1 (cao cấp)',       costTier: 'premium' },
]

/** Kiểm tra hợp lệ */
export function isAllowedModel(m: string): m is AllowedModel {
    return (ALLOWED_MODELS as readonly string[]).includes(m)
}

/** Chuẩn hoá giá trị model (fallback về default nếu sai) */
export function normalizeModel(m?: string | null): AllowedModel {
    return isAllowedModel(m ?? '') ? (m as AllowedModel) : DEFAULT_MODEL_ID
}
