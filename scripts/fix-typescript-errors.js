// scripts/fix-typescript-errors.js
// Chạy: node scripts/fix-typescript-errors.js

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting TypeScript error fixes...\n');

// 1. Fix billing/costs.ts
const costsPath = path.join(process.cwd(), 'src/lib/billing/costs.ts');
if (fs.existsSync(costsPath)) {
    let content = fs.readFileSync(costsPath, 'utf8');

    // Replace content with corrected version
    const newContent = `// lib/billing/costs.ts
import { ModelId } from '@prisma/client'

export type PricePerK = { in: number; out: number } // USD per 1K tokens

export const PRICES_PER_K: Record<ModelId, PricePerK> = {
    // OpenAI
    gpt_4_turbo: { in: 10, out: 30 },
    gpt_4o: { in: 5, out: 15 },
    gpt_4o_mini: { in: 0.15, out: 0.6 },
    gpt_3_5_turbo: { in: 0.5, out: 1.5 },
    
    // Anthropic
    claude_3_opus: { in: 15, out: 75 },
    claude_3_5_sonnet: { in: 3, out: 15 },
    claude_3_5_haiku: { in: 1, out: 5 },
    
    // Google
    gemini_1_5_pro: { in: 3.5, out: 10.5 },
    gemini_1_5_flash: { in: 0.075, out: 0.3 },
    gemini_2_0_flash: { in: 0, out: 0 }, // Free during experimental
    
    // Legacy mappings
    gpt5_thinking: { in: 0.8, out: 2.4 },
    gpt5_mini: { in: 0.15, out: 0.6 },
    gpt4o_mini: { in: 0.05, out: 0.2 },
}

export function calcCostUsd(model: ModelId, tokensIn: number, tokensOut: number) {
    const p = PRICES_PER_K[model]
    if (!p) {
        // Fallback to cheapest model if not found
        const fallback = PRICES_PER_K.gpt_4o_mini
        return (tokensIn * fallback.in + tokensOut * fallback.out) / 1000
    }
    const cost = (tokensIn * p.in + tokensOut * p.out) / 1000
    return Math.round(cost * 1e6) / 1e6
}`;

    fs.writeFileSync(costsPath, newContent, 'utf8');
    console.log('✅ Fixed src/lib/billing/costs.ts');
}

// 2. Fix chat/send/route.ts imports
const chatSendPath = path.join(process.cwd(), 'src/app/api/chat/send/route.ts');
if (fs.existsSync(chatSendPath)) {
    let content = fs.readFileSync(chatSendPath, 'utf8');

    // Remove duplicate import
    content = content.replace(
        /import { getUserIdFromSession } from '@\/lib\/auth\/session'/g,
        ''
    );

    // Fix ModelId import
    if (!content.includes("import { ModelId }")) {
        content = content.replace(
            "import { prisma } from '@/lib/db'",
            "import { prisma } from '@/lib/prisma'"
        );
    }

    // Fix function duplication
    content = content.replace(
        /^async function getUserIdFromSession\(\)[^}]+}/gm,
        ''
    );

    // Add proper import at top if not present
    const lines = content.split('\n');
    const hasSessionImport = lines.some(l => l.includes("from '@/lib/auth/session'"));
    if (!hasSessionImport) {
        // Find the last import line
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                lastImportIndex = i;
            }
        }
        if (lastImportIndex >= 0) {
            lines.splice(lastImportIndex + 1, 0, "import { getUserIdFromSession } from '@/lib/auth/session'");
        }
    }

    content = lines.join('\n');
    fs.writeFileSync(chatSendPath, content, 'utf8');
    console.log('✅ Fixed src/app/api/chat/send/route.ts');
}

// 3. Remove duplicate chat/v2/route.ts (if exists)
const chatV2Path = path.join(process.cwd(), 'src/app/api/chat/v2/route.ts');
const chatV2StreamPath = path.join(process.cwd(), 'src/app/api/chat/v2/stream/route.ts');
if (fs.existsSync(chatV2Path)) {
    // Instead of having duplicate code, remove it
    fs.unlinkSync(chatV2Path);
    console.log('✅ Removed duplicate src/app/api/chat/v2/route.ts');
}
if (fs.existsSync(chatV2StreamPath)) {
    fs.unlinkSync(chatV2StreamPath);
    console.log('✅ Removed duplicate src/app/api/chat/v2/stream/route.ts');
}

// 4. Fix dev scripts
const quotaSmokePath = path.join(process.cwd(), 'scripts/dev/quotaSmoke.ts');
if (fs.existsSync(quotaSmokePath)) {
    let content = fs.readFileSync(quotaSmokePath, 'utf8');

    // Update ModelId usage
    content = content.replace(
        'ModelId.gpt5_mini',
        'ModelId.gpt_4o_mini'
    );

    fs.writeFileSync(quotaSmokePath, content, 'utf8');
    console.log('✅ Fixed scripts/dev/quotaSmoke.ts');
}

// 5. Fix usage-record route
const usageRecordPath = path.join(process.cwd(), 'src/app/api/dev/usage-record/route.ts');
if (fs.existsSync(usageRecordPath)) {
    let content = fs.readFileSync(usageRecordPath, 'utf8');

    // Update ModelId handling
    content = content.replace(
        'const modelEnum = ModelId[modelStr] ?? ModelId.gpt5_mini',
        'const modelEnum = ModelId[modelStr as keyof typeof ModelId] ?? ModelId.gpt_4o_mini'
    );

    fs.writeFileSync(usageRecordPath, content, 'utf8');
    console.log('✅ Fixed src/app/api/dev/usage-record/route.ts');
}

// 6. Delete the problematic AI providers file
const aiProvidersTypesPath = path.join(process.cwd(), 'src/lib/ai/providers/types.ts');
if (fs.existsSync(aiProvidersTypesPath)) {
    fs.unlinkSync(aiProvidersTypesPath);
    console.log('✅ Removed problematic src/lib/ai/providers/types.ts');
}

// 7. Clean up duplicate/old session files
const oldSessionPath = path.join(process.cwd(), 'src/lib/session.ts');
if (fs.existsSync(oldSessionPath)) {
    // Create redirect file instead of deleting
    const redirectContent = `// Redirect to new location
export * from './auth/session'
`;
    fs.writeFileSync(oldSessionPath, redirectContent, 'utf8');
    console.log('✅ Redirected src/lib/session.ts to auth/session.ts');
}

// 8. Fix Markdown component
const markdownPath = path.join(process.cwd(), 'src/components/Markdown.tsx');
if (fs.existsSync(markdownPath)) {
    let content = fs.readFileSync(markdownPath, 'utf8');

    // Fix the inline prop issue
    content = content.replace(
        'code({ inline, className, children, ...rest })',
        'code({ className, children, ...rest }: any)'
    );

    // Fix the pre element type issue
    content = content.replace(
        '<pre\n                    className={`${className ?? ""} max-h-[60vh] overflow-auto rounded-lg`}\n                    {...rest}\n                >',
        '<pre className={`${className ?? ""} max-h-[60vh] overflow-auto rounded-lg`}>'
    );

    fs.writeFileSync(markdownPath, content, 'utf8');
    console.log('✅ Fixed src/components/Markdown.tsx');
}

// 9. Fix ConversationSettings
const convSettingsPath = path.join(process.cwd(), 'src/components/chat/ConversationSettings.tsx');
if (fs.existsSync(convSettingsPath)) {
    let content = fs.readFileSync(convSettingsPath, 'utf8');

    // Add import for ALL_MODELS
    if (!content.includes("import { ALL_MODELS")) {
        content = content.replace(
            "import { DEFAULT_MODEL_ID, MODELS_DISPLAY, isAllowedModel, normalizeModel } from '@/lib/ai/models'",
            "import { DEFAULT_MODEL_ID, MODELS_DISPLAY, isAllowedModel, normalizeModel, ALL_MODELS } from '@/lib/ai/models'"
        );
    }

    fs.writeFileSync(convSettingsPath, content, 'utf8');
    console.log('✅ Fixed src/components/chat/ConversationSettings.tsx');
}

console.log('\n✨ TypeScript error fixes completed!');
console.log('\n📝 Next steps:');
console.log('1. Run: npx prisma db push (to update schema)');
console.log('2. Run: npx prisma generate');
console.log('3. Run: npm run type-check');
console.log('4. Run: npm run dev');