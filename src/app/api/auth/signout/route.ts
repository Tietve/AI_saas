// src/app/api/auth/signout/route.ts
import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/auth/session"

export async function POST(req: Request) {
    try {
        // Lấy cookie config để clear session
        const cookieConfig = await clearSessionCookie()

        // Tạo response redirect về signin
        const response = NextResponse.json({
            ok: true,
            message: "Đăng xuất thành công",
            redirectUrl: '/auth/signin' // Thêm redirectUrl
        })

        // Set cookie với maxAge=0 để browser xóa cookie
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

        // Lấy origin từ request headers
        const origin = req.headers.get('origin') || 'http://localhost:3000'

        // Redirect về signin với URL tuyệt đối
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
        // Fallback redirect
        const origin = req.headers.get('origin') || 'http://localhost:3000'
        return NextResponse.redirect(new URL('/auth/signin', origin))
    }
}