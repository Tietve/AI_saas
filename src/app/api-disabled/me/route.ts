
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth/session"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")

        console.log('[/api/me] Session cookie exists:', !!sessionCookie?.value)

        if (!sessionCookie?.value) {
            console.log('[/api/me] No session cookie found')
            return NextResponse.json({
                authenticated: false,
                reason: 'no_session_cookie'
            }, { status: 200 })
        }

        try {
            const payload = await verifySession(sessionCookie.value)
            console.log('[/api/me] Session verified for user:', payload.uid)

            return NextResponse.json({
                authenticated: true,
                user: {
                    id: payload.uid,
                    email: payload.email
                }
            }, { status: 200 })
        } catch (verifyError) {
            console.log('[/api/me] Session verification failed:', verifyError)
            return NextResponse.json({
                authenticated: false,
                reason: 'invalid_session'
            }, { status: 200 })
        }
    } catch (error) {
        console.error('[/api/me] Unexpected error:', error)
        return NextResponse.json({
            authenticated: false,
            reason: 'server_error'
        }, { status: 200 })
    }
}