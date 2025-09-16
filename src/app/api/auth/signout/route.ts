// src/app/api/auth/signout/route.ts
import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/auth/session"

/**
 * POST /api/auth/signout
 * Xóa session cookie để logout user
 */
export async function POST() {
    try {
        // Lấy cookie config để clear session
        const cookieConfig = await clearSessionCookie()

        // Tạo response với success message
        const response = NextResponse.json({
            ok: true,
            message: "Đăng xuất thành công"
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

/**
 * GET /api/auth/signout
 * Support GET method cho các trường hợp redirect đơn giản
 */
export async function GET() {
    try {
        const cookieConfig = await clearSessionCookie()

        // Redirect về trang login sau khi logout
        const response = NextResponse.redirect(
            new URL('/auth/signin', process.env.NEXTAUTH_URL || 'http://localhost:3000')
        )

        response.cookies.set(
            cookieConfig.name,
            cookieConfig.value,
            cookieConfig.options as any
        )

        return response
    } catch (error) {
        console.error('[signout GET] Error:', error)
        return NextResponse.redirect(
            new URL('/auth/signin', process.env.NEXTAUTH_URL || 'http://localhost:3000')
        )
    }
}