// src/app/api/me/route.ts
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
}