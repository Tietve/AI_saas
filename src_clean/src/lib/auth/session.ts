

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify, JWTPayload } from 'jose'


const ALG = 'HS256'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session'
const MAX_AGE_SEC = 60 * 60 * 24 * 7 


function getSecretKey(): Uint8Array {
    const secret = process.env.AUTH_SECRET
    if (!secret || secret.length < 32) {
        throw new Error('AUTH_SECRET must be at least 32 characters long')
    }
    return new TextEncoder().encode(secret)
}


export interface SessionPayload extends JWTPayload {
    uid: string 
    email?: string 
    role?: string 
}


export async function signSession(payload: SessionPayload): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime(`${MAX_AGE_SEC}s`)
        .sign(getSecretKey())
}


export async function verifySession(token: string): Promise<SessionPayload> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            algorithms: [ALG]
        })
        return payload as SessionPayload
    } catch (error) {
        console.error('[verifySession] Invalid token:', error)
        throw new Error('Invalid session token')
    }
}


export async function createSessionCookie(
    userId: string,
    additionalData?: Partial<SessionPayload>
) {
    const token = await signSession({
        uid: userId,
        ...additionalData
    })

    return {
        name: COOKIE_NAME,
        value: token,
        options: {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax' as const, 
            path: '/',
            maxAge: MAX_AGE_SEC,
        }
    }
}


export async function clearSessionCookie() {
    return {
        name: COOKIE_NAME,
        value: '',
        options: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            path: '/',
            maxAge: 0 
        }
    }
}


export async function getUserIdFromSession(): Promise<string | null> {
    try {
        
        const cookieStore = await cookies()
        const token = cookieStore.get(COOKIE_NAME)?.value

        if (!token) {
            return null
        }

        const payload = await verifySession(token)

        
        const userId = payload.uid || payload.sub || (payload as any).userId

        return typeof userId === 'string' ? userId : null
    } catch (error) {
        console.error('[getUserIdFromSession] Error:', error)
        return null
    }
}


export async function getSession(): Promise<SessionPayload | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(COOKIE_NAME)?.value

        if (!token) {
            return null
        }

        return await verifySession(token)
    } catch (error) {
        return null
    }
}


export async function requireUserId(): Promise<string> {
    const userId = await getUserIdFromSession()

    if (!userId) {
        throw new Error('UNAUTHENTICATED')
    }

    return userId
}


export async function requireSession(): Promise<SessionPayload> {
    const session = await getSession()

    if (!session) {
        throw new Error('UNAUTHENTICATED')
    }

    return session
}


export async function refreshSession(currentToken: string): Promise<string> {
    const payload = await verifySession(currentToken)

    
    return await signSession({
        ...payload,
        iat: undefined, 
        exp: undefined  
    })
}


export async function isAuthenticated(): Promise<boolean> {
    const userId = await getUserIdFromSession()
    return userId !== null
}


export type { SessionPayload as SessionData }