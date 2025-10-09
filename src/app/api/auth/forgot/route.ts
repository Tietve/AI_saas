/**
 * @swagger
 * /api/auth/forgot:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: Sends a password reset email to the user's email address if it exists
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
 *         description: Request processed (always returns success for security)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
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
 *                 error:
 *                   type: string
 */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
    const reqId = Math.random().toString(36).slice(2, 8);
    try {
        const body = await req.json();
        const emailInput = String(body?.email || "").trim().toLowerCase(); // normalize
        const { email } = schema.parse({ email: emailInput });

        console.log(`[FORGOT ${reqId}] start`, { email });

        // ✅ dùng field unique: emailLower
        const user = await prisma.user.findUnique({ where: { emailLower: email } });

        if (!user) {
            console.log(`[FORGOT ${reqId}] user not found -> 200 (no-op)`);
            return NextResponse.json({ ok: true });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

        await prisma.$transaction([
            prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
            prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } }),
        ]);

        await sendPasswordResetEmail(email, rawToken);
        console.log(`[FORGOT ${reqId}] mail sent to ${email}`);

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error(`[FORGOT ${reqId}] ERROR`, e);
        return NextResponse.json({ ok: false, error: "INTERNAL" }, { status: 500 });
    }
}
