// src/lib/auth/session.ts
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify, JWTPayload } from 'jose'

const ALG = 'HS256'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session'
const maxAgeSec = 60 * 60 * 24 * 7

function getSecretKey(): Uint8Array {
    const sec = process.env.AUTH_SECRET || 'dev-secret-change'
    return new TextEncoder().encode(sec)
}

export type SessionPayload = { uid: string } & JWTPayload

export async function signSession(payload: SessionPayload): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime(`${maxAgeSec}s`)
        .sign(getSecretKey())
}

export async function verifySession(token: string): Promise<SessionPayload> {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: [ALG] })
    return payload as SessionPayload
}

export async function getUserIdFromSession(): Promise<string | null> {
    const store = await cookies() // Next 15: phải await
    const token = store.get(COOKIE_NAME)?.value
    if (!token) return null
    try {
        const payload = await verifySession(token)
        const uid = (payload as any).uid || (payload.sub as string | undefined)
        return typeof uid === 'string' ? uid : null
    } catch {
        return null
    }
}

export async function requireUserId(): Promise<string> {
    const uid = await getUserIdFromSession()
    if (!uid) throw new Error('UNAUTHENTICATED')
    return uid
}
