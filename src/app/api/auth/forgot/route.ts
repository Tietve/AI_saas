// src/app/api/auth/forgot/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
export const runtime = "nodejs";
const ForgotSchema = z.object({ email: z.string().email() });

function sha256(raw: string) {
    return createHash("sha256").update(raw).digest("hex");
}
function randomToken(len = 32) {
    return randomBytes(len).toString("hex");
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = ForgotSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 400 });
        }

        const email = parsed.data.email;
        const emailLower = email.trim().toLowerCase();

        const user = await prisma.user.findFirst({ where: { emailLower } });

        // Luôn trả ok để không lộ user tồn tại hay không
        if (!user) return NextResponse.json({ ok: true }, { status: 200 });

        // Xóa token cũ
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        // Tạo token mới
        const rawToken = randomToken(32);
        const tokenHash = sha256(rawToken);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

        await prisma.passwordResetToken.create({
            data: { userId: user.id, tokenHash, expiresAt },
        });

        // Gửi email qua MailHog
        await sendPasswordResetEmail(user.email, rawToken);

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err: any) {
        console.error("/api/auth/forgot error:", err?.message || err);
        return NextResponse.json({ code: "INTERNAL" }, { status: 500 });
    }
}
