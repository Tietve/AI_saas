/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Sign out of user account
 *     description: Clears the session cookie and signs the user out
 *     responses:
 *       200:
 *         description: Sign out successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 redirectUrl:
 *                   type: string
 *                   example: /auth/signin
 *         headers:
 *           Set-Cookie:
 *             description: Cleared session cookie
 *             schema:
 *               type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Sign out and redirect (GET method)
 *     description: Signs out user and redirects to signin page
 *     responses:
 *       302:
 *         description: Redirect to signin page
 *         headers:
 *           Location:
 *             description: Redirect URL
 *             schema:
 *               type: string
 *               example: /auth/signin
 *           Set-Cookie:
 *             description: Cleared session cookie
 *             schema:
 *               type: string
 */

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