/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Sign in to user account
 *     description: Authenticates user with email and password. Returns session cookie on success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Sign in successful
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
 *                   example: /chat
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie for authenticated requests
 *             schema:
 *               type: string
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 needsVerification:
 *                   type: boolean
 *                   example: true
 *                 email:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { createSessionCookie } from '@/lib/auth/session'
import { isAccountLocked, recordFailedAttempt, clearFailedAttempts } from '@/lib/security/account-lockout'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const email = body?.email?.trim()
        const password = body?.password

        console.log('[signin] Attempt for:', email)

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email và mật khẩu là bắt buộc' },
                { status: 400 }
            )
        }

        const emailLower = email.toLowerCase()

        // Check if account is locked
        const lockStatus = await isAccountLocked(emailLower)
        if (lockStatus.locked) {
            const minutesRemaining = Math.ceil((lockStatus.timeRemaining || 0) / 60)
            console.log('[signin] Account locked:', emailLower, 'for', minutesRemaining, 'minutes')
            return NextResponse.json(
                {
                    error: `Tài khoản tạm thời bị khóa do quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${minutesRemaining} phút.`,
                    locked: true,
                    lockedUntil: lockStatus.lockedUntil,
                },
                { status: 429 }
            )
        }

        
        const user = await prisma.user.findUnique({
            where: { emailLower },
            select: {
                id: true,
                email: true,
                passwordHash: true,
                emailVerifiedAt: true
            }
        })

        if (!user) {
            console.log('[signin] User not found:', emailLower)
            // Record failed attempt
            await recordFailedAttempt(emailLower)
            return NextResponse.json(
                { error: 'Email hoặc mật khẩu không đúng' },
                { status: 401 }
            )
        }


        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) {
            console.log('[signin] Invalid password for:', emailLower)
            // Record failed attempt
            const lockoutStatus = await recordFailedAttempt(emailLower)

            if (lockoutStatus.locked) {
                return NextResponse.json(
                    {
                        error: `Quá nhiều lần đăng nhập sai. Tài khoản đã bị khóa trong 15 phút.`,
                        locked: true,
                        lockedUntil: lockoutStatus.lockedUntil,
                    },
                    { status: 429 }
                )
            }

            return NextResponse.json(
                {
                    error: 'Email hoặc mật khẩu không đúng',
                    attemptsLeft: lockoutStatus.attemptsLeft,
                },
                { status: 401 }
            )
        }

        
        const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
        if (requireVerification && !user.emailVerifiedAt) {
            console.log('[signin] Email not verified for:', emailLower)
            return NextResponse.json(
                {
                    error: 'Vui lòng xác thực email trước khi đăng nhập',
                    needsVerification: true,
                    email: user.email
                },
                { status: 403 }
            )
        }

        // Clear failed attempts on successful login
        await clearFailedAttempts(emailLower)

        const cookieData = await createSessionCookie(user.id, {
            email: user.email || emailLower
        })

        console.log('[signin] Success for:', user.id)

        const response = NextResponse.json({
            ok: true,
            message: 'Đăng nhập thành công',
            redirectUrl: '/chat'
        })

        
        response.cookies.set(
            cookieData.name,
            cookieData.value,
            {
                httpOnly: true,
                secure: false, 
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7
            }
        )

        return response

    } catch (error) {
        console.error('[signin] Error:', error)
        return NextResponse.json(
            { error: 'Có lỗi xảy ra' },
            { status: 500 }
        )
    }
}