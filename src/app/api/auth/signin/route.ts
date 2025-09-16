// src/app/api/auth/signin/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SignJWT, jwtVerify } from 'jose'
import * as argon2 from 'argon2'
import * as bcrypt from 'bcryptjs'
import type { JWTPayload } from 'jose'

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 ngày
const ALG = 'HS256'

function getSecretKey(): Uint8Array {
    const sec = process.env.AUTH_SECRET || 'dev-secret-change'
    return new TextEncoder().encode(sec)
}

async function signSession(payload: { uid: string } & JWTPayload): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime(`${COOKIE_MAX_AGE}s`)
        .sign(getSecretKey())
}

// Tự động nhận diện & verify hash (argon2 hoặc bcrypt)
async function verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
        if (hash.startsWith('$argon2')) {
            return await argon2.verify(hash, plain)
        }
        if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
            return await bcrypt.compare(plain, hash)
        }
        // Không nhận ra định dạng → thử cả hai (an toàn cho dữ liệu cũ)
        return (await argon2.verify(hash, plain).catch(() => false)) ||
            (await bcrypt.compare(plain, hash).catch(() => false))
    } catch {
        return false
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}))
        const emailInput = String(body?.email ?? '').trim()
        const password = String(body?.password ?? '')

        if (!emailInput || !password) {
            return NextResponse.json({ error: 'MISSING_CREDENTIALS' }, { status: 400 })
        }

        const emailLower = emailInput.toLowerCase()
        // Tìm theo emailLower, fallback email (để không phụ thuộc seed cũ)
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { emailLower },
                    { email: emailInput },
                ],
            },
            select: { id: true, passwordHash: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })
        }

        const ok = await verifyPassword(user.passwordHash, password)
        if (!ok) {
            return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })
        }

        const token = await signSession({ uid: user.id })
        const res = NextResponse.json({ ok: true })
        res.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: COOKIE_MAX_AGE,
        })
        return res
    } catch (e) {
        return NextResponse.json({ error: 'INTERNAL' }, { status: 500 })
    }
}
