// src/app/api/auth/forgot/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
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
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

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
