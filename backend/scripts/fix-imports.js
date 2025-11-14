// scripts/fix-imports.js
// Chạy script này với: node scripts/fix-imports.js

const fs = require('fs');
const path = require('path');

// Mapping các import cần sửa
const importReplacements = [
    // Database imports
    { from: /@\/lib\/db(?!\.)/g, to: '@/lib/prisma' },
    { from: /from ['"]@\/lib\/db['"]/, to: "from '@/lib/prisma'" },

    // Auth imports
    { from: /from ['"]@\/lib\/auth['"]/, to: "from '@/lib/auth/session'" },

    // Crypto imports
    { from: /hashPassword/g, to: 'hashPassword' }, // Keep as is
    { from: /verifyPassword/g, to: 'verifyPassword' }, // Keep as is

    // Session imports
    { from: /verifySessionCookie/g, to: 'verifySession' },
    { from: /destroySessionCookie/g, to: 'clearSessionCookie' },
];

// Danh sách các file cần kiểm tra và sửa
const filesToFix = [
    'src/app/api/auth/signin/route.ts',
    'src/app/api/auth/signup/route.ts',
    'src/app/api/auth/forgot/route.ts',
    'src/app/api/auth/reset/route.ts',
    'src/app/api/auth/verify-email/route.ts',
    'src/app/api/auth/signout/route.ts',
    'src/app/api/chat/route.ts',
    'src/app/api/chat/stream/route.ts',
    'src/app/api/chat/send/route.ts',
    'src/app/api/conversations/route.ts',
    'src/app/api/conversations/[id]/route.ts',
    'src/app/api/conversations/[id]/messages/route.ts',
    'src/app/api/conversations/[id]/rename/route.ts',
    'src/app/api/me/route.ts',
    'src/lib/auth-service.ts',
    'src/lib/billing/quota.ts',
    'scripts/dev/quotaSmoke.ts',
    'scripts/resetMonthlyUsage.ts',
];

console.log('🔧 Starting to fix import paths...\n');

let totalFixed = 0;

filesToFix.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    let fixedCount = 0;

    // Apply replacements
    importReplacements.forEach(replacement => {
        const matches = content.match(replacement.from);
        if (matches) {
            content = content.replace(replacement.from, replacement.to);
            fixedCount += matches.length;
        }
    });

    // Specific fixes for each file
    if (filePath.includes('signin/route.ts')) {
        // Fix incorrect imports in signin
        content = content.replace(
            "import { prisma } from '@/lib/prisma'",
            "import { prisma } from '@/lib/prisma'"
        );
    }

    if (filePath.includes('signout/route.ts')) {
        // Fix signout specific imports
        content = content.replace(
            'import { destroySessionCookie } from "@/lib/session"',
            'import { clearSessionCookie } from "@/lib/auth/session"'
        );

        // Fix function call
        content = content.replace(
            'const { name, value, options } = destroySessionCookie();',
            'const { name, value, options } = await clearSessionCookie();'
        );
    }

    if (filePath.includes('verify-email/route.ts')) {
        // Fix crypto imports
        content = content.replace(
            'import { sha256 } from "@/lib/crypto"',
            'import { sha256 } from "@/lib/crypto"'
        );
    }

    if (filePath.includes('billing/quota.ts')) {
        // Fix db import in quota
        content = content.replace(
            "import { prisma } from '@/lib/db'",
            "import { prisma } from '@/lib/prisma'"
        );
    }

    // Write back if changes were made
    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed ${fixedCount} imports in: ${filePath}`);
        totalFixed += fixedCount;
    } else {
        console.log(`✓  No changes needed in: ${filePath}`);
    }
});

console.log(`\n🎉 Total imports fixed: ${totalFixed}`);
console.log('\n📝 Next steps:');
console.log('1. Run: npm run dev');
console.log('2. Check for any remaining TypeScript errors');
console.log('3. Test authentication flow');