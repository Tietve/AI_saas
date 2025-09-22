
import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/auth/session"

export async function POST(req: Request) {
    try {
        
        const cookieConfig = await clearSessionCookie()

        
        const response = NextResponse.json({
            ok: true,
            message: "Đăng xuất thành công",
            redirectUrl: '/auth/signin' 
        })

        
        response.cookies.set(
            cookieConfig.name,
            cookieConfig.value,
            cookieConfig.options as any
        )

        return response
    } catch (error) {
        console.error('[signout] Error:', error)
        return NextResponse.json(
            { ok: false, error: "Có lỗi xảy ra khi đăng xuất" },
            { status: 500 }
        )
    }
}

export async function GET(req: Request) {
    try {
        const cookieConfig = await clearSessionCookie()

        
        const origin = req.headers.get('origin') || 'http://localhost:3000'

        
        const response = NextResponse.redirect(
            new URL('/auth/signin', origin)
        )

        response.cookies.set(
            cookieConfig.name,
            cookieConfig.value,
            cookieConfig.options as any
        )

        return response
    } catch (error) {
        console.error('[signout GET] Error:', error)
        
        const origin = req.headers.get('origin') || 'http://localhost:3000'
        return NextResponse.redirect(new URL('/auth/signin', origin))
    }
}