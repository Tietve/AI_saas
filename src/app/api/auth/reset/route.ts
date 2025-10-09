/**
 * @swagger
 * /api/auth/reset:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password with token
 *     description: Resets user's password using the token from password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 10
 *                 description: Password reset token from email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 format: password
 *                 description: New password (minimum 8 characters)
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid or expired token
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'

const schema = z.object({
    token: z.string().min(10),
    password: z.string().min(8),
});


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, password } = schema.parse(body);


        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");


        const record = await prisma.passwordResetToken.findUnique({
            where: { tokenHash },
            include: { user: true },
        });


        if (!record || record.usedAt || record.expiresAt < new Date()) {
            return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 400 });
        }


        const newHash = await hashPassword(password);


        await prisma.$transaction([
            prisma.user.update({ where: { id: record.userId }, data: { passwordHash: newHash } }),
            prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
            prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null, NOT: { tokenHash } } }),
        ]);


        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("/api/auth/reset", err);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}