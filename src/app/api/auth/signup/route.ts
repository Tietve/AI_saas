// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { createSessionCookie } from '@/lib/auth/session'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const email = body?.email?.trim()
        const password = body?.password

        console.log('[signup] Starting for:', email)

        // Validation
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

        // Check existing user
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

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12)

        // Check if email verification required
        const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true'

        // Create user
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
            // Create verification token
            const rawToken = crypto.randomBytes(32).toString("hex")
            const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

            await prisma.emailVerificationToken.create({
                data: {
                    userId: user.id,
                    tokenHash,
                    expiresAt
                }
            })

            // Send verification email
            try {
                await sendVerificationEmail(email, rawToken)
                console.log('[signup] Verification email sent')
            } catch (emailError) {
                console.error('[signup] Email send failed:', emailError)
                // Continue anyway - user can request resend
            }

            return NextResponse.json({
                ok: true,
                needsVerification: true,
                message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
                email: email
            })
        } else {
            // Auto login if no verification needed
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