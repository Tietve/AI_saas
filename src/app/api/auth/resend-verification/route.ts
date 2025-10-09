/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Resend email verification
 *     description: Sends a new verification email to the user if their email is not yet verified
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification email sent or email already verified
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
 *       400:
 *         description: Email is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to send email or server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const email = body?.email?.trim()?.toLowerCase()

        console.log('[resend-verification] Request for:', email)

        if (!email) {
            return NextResponse.json(
                { error: "Email là bắt buộc" },
                { status: 400 }
            )
        }

        
        const user = await prisma.user.findUnique({
            where: { emailLower: email }
        })

        if (!user) {
            console.log('[resend-verification] User not found:', email)
            
            return NextResponse.json({ ok: true })
        }

        if (user.emailVerifiedAt) {
            console.log('[resend-verification] Already verified:', email)
            return NextResponse.json({
                ok: true,
                message: 'Email đã được xác thực'
            })
        }

        
        await prisma.emailVerificationToken.deleteMany({
            where: { userId: user.id }
        })

        
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
            await sendVerificationEmail(user.email || email, rawToken)
            console.log('[resend-verification] Email sent to:', email)
        } catch (emailError) {
            console.error('[resend-verification] Email send failed:', emailError)
            return NextResponse.json(
                { error: "Không thể gửi email. Vui lòng thử lại." },
                { status: 500 }
            )
        }

        return NextResponse.json({
            ok: true,
            message: 'Email xác thực đã được gửi lại!'
        })

    } catch (error) {
        console.error('[resend-verification] Error:', error)
        return NextResponse.json(
            { error: "Có lỗi xảy ra" },
            { status: 500 }
        )
    }
}