/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user account
 *     description: Creates a new user account with email and password. Sends verification email if email verification is enabled.
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
 *                 minLength: 6
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     ok:
 *                       type: boolean
 *                       example: true
 *                     needsVerification:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                     email:
 *                       type: string
 *                 - type: object
 *                   properties:
 *                     ok:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                     redirectUrl:
 *                       type: string
 *                       example: /chat
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie (if verification disabled)
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid input (missing fields or password too short)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { createSessionCookie } from '@/lib/auth/session'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const email = body?.email?.trim()
        const password = body?.password

        console.log('[signup] Starting for:', email)

        
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email và mật khẩu là bắt buộc' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
                { status: 400 }
            )
        }

        const emailLower = email.toLowerCase()

        
        const existingUser = await prisma.user.findUnique({
            where: { emailLower }
        })

        if (existingUser) {
            console.log('[signup] User already exists:', emailLower)
            return NextResponse.json(
                { error: 'Email đã được sử dụng' },
                { status: 409 }
            )
        }

        
        const passwordHash = await bcrypt.hash(password, 12)

        
        const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'

        
        const user = await prisma.user.create({
            data: {
                email: email,
                emailLower: emailLower,
                passwordHash,
                emailVerifiedAt: requireVerification ? null : new Date(),
                planTier: 'FREE',
                monthlyTokenUsed: 0
            }
        })

        console.log('[signup] Created user:', user.id)

        if (requireVerification) {
            
            const rawToken = crypto.randomBytes(32).toString("hex")
            const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000) 

            await prisma.emailVerificationToken.create({
                data: {
                    userId: user.id,
                    tokenHash,
                    expiresAt
                }
            })

            
            try {
                await sendVerificationEmail(email, rawToken)
                console.log('[signup] Verification email sent')
            } catch (emailError) {
                console.error('[signup] Email send failed:', emailError)
                
            }

            return NextResponse.json({
                ok: true,
                needsVerification: true,
                message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
                email: email
            })
        } else {
            
            const cookieData = await createSessionCookie(user.id, { email })

            const response = NextResponse.json({
                ok: true,
                message: 'Đăng ký thành công',
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
        }

    } catch (error: any) {
        console.error('[signup] Error:', error)
        return NextResponse.json(
            { error: 'Có lỗi xảy ra khi đăng ký' },
            { status: 500 }
        )
    }
}