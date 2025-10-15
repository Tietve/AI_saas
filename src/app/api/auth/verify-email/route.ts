/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Verify user email address
 *     description: Verifies user's email using the token sent via email. Redirects to verified page on success.
 *     parameters:
 *       - name: token
 *         in: query
 *         description: Email verification token from email link
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Verification successful - redirect to verified page
 *         headers:
 *           Location:
 *             description: Redirect URL
 *             schema:
 *               type: string
 *               example: /auth/verified
 *       400:
 *         description: Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       410:
 *         description: Token expired
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

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const token = url.searchParams.get("token")

        if (!token) {
            return NextResponse.json(
                { error: "Token không hợp lệ" },
                { status: 400 }
            )
        }

        console.log('[verify-email] Verifying token')

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

        const verificationToken = await prisma.emailVerificationToken.findUnique({
            where: { tokenHash },
            include: { user: true }
        })

        if (!verificationToken) {
            console.log('[verify-email] Token not found')
            return NextResponse.json(
                { error: "Token không hợp lệ" },
                { status: 400 }
            )
        }

        if (verificationToken.expiresAt < new Date()) {
            console.log('[verify-email] Token expired')
            await prisma.emailVerificationToken.delete({
                where: { id: verificationToken.id }
            })
            return NextResponse.json(
                { error: "Token đã hết hạn" },
                { status: 410 }
            )
        }

        
        await prisma.$transaction([
            prisma.user.update({
                where: { id: verificationToken.userId },
                data: { emailVerifiedAt: new Date() }
            }),
            prisma.emailVerificationToken.delete({
                where: { id: verificationToken.id }
            })
        ])

        console.log('[verify-email] Success for user:', verificationToken.userId)

        
        return NextResponse.redirect(new URL('/auth/verified', req.url))

    } catch (error) {
        console.error('[verify-email] Error:', error)
        return NextResponse.json(
            { error: "Có lỗi xảy ra" },
            { status: 500 }
        )
    }
}