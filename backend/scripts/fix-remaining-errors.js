// scripts/fix-remaining-errors.js
// Chạy: node scripts/fix-remaining-errors.js

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining TypeScript errors...\n');

// 1. Fix /api/me/route.ts - remove duplicates
const meRoutePath = path.join(process.cwd(), 'src/app/api/me/route.ts');
const meRouteContent = `// src/app/api/me/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth/session"

export async function GET() {
    try {
        // Next.js 15 requires await for cookies()
        const cookieStore = await cookies()
        const token = cookieStore.get("session")?.value
        
        if (!token) {
            return NextResponse.json({ 
                authenticated: false 
            }, { status: 200 })
        }
        
        const payload = await verifySession(token)
        
        return NextResponse.json({ 
            authenticated: true, 
            user: {
                id: payload.uid,
                email: payload.email,
                role: payload.role
            }
        }, { status: 200 })
        
    } catch (error) {
        console.error('[/api/me] Error verifying session:', error)
        return NextResponse.json({ 
            authenticated: false 
        }, { status: 200 })
    }
}`;

fs.writeFileSync(meRoutePath, meRouteContent, 'utf8');
console.log('✅ Fixed src/app/api/me/route.ts');

// 2. Fix or remove lib/auth.ts
const libAuthPath = path.join(process.cwd(), 'src/lib/auth.ts');
const libAuthContent = `// src/lib/auth.ts
// Redirect to the main auth/session module
export * from './auth/session'
`;

fs.writeFileSync(libAuthPath, libAuthContent, 'utf8');
console.log('✅ Fixed src/lib/auth.ts (redirected to auth/session)');

// 3. Update src/lib/session.ts to redirect
const libSessionPath = path.join(process.cwd(), 'src/lib/session.ts');
if (fs.existsSync(libSessionPath)) {
    const sessionRedirect = `// src/lib/session.ts
// Redirect to the new location
export * from './auth/session'
`;
    fs.writeFileSync(libSessionPath, sessionRedirect, 'utf8');
    console.log('✅ Fixed src/lib/session.ts (redirected)');
}

// 4. Fix Markdown component
const markdownPath = path.join(process.cwd(), 'src/components/Markdown.tsx');
if (fs.existsSync(markdownPath)) {
    let markdownContent = fs.readFileSync(markdownPath, 'utf8');

    // Replace the problematic code function
    markdownContent = markdownContent.replace(
        /code\(\{[^}]*\}\)/,
        'code({ node, className, children, ...props }: any)'
    );

    // Fix inline variable reference
    markdownContent = markdownContent.replace(
        'if (inline)',
        'const isInline = !className || !className.includes("language-");\n                        if (isInline)'
    );

    fs.writeFileSync(markdownPath, markdownContent, 'utf8');
    console.log('✅ Fixed src/components/Markdown.tsx');
}

// 5. Add missing import to chat/send/route.ts
const chatSendPath = path.join(process.cwd(), 'src/app/api/chat/send/route.ts');
if (fs.existsSync(chatSendPath)) {
    let content = fs.readFileSync(chatSendPath, 'utf8');

    // Make sure ModelId is imported
    if (!content.includes('import { ModelId')) {
        // Find the Prisma import line
        content = content.replace(
            "import { Role } from '@prisma/client'",
            "import { ModelId, Role } from '@prisma/client'"
        );
    }

    fs.writeFileSync(chatSendPath, content, 'utf8');
    console.log('✅ Updated imports in src/app/api/chat/send/route.ts');
}

console.log('\n✨ All remaining errors should be fixed!');
console.log('\n📝 Next steps:');
console.log('1. Run: npm install --save-dev @types/jsonwebtoken');
console.log('2. Run: npm run type-check');
console.log('3. If no errors, run: npm run dev');