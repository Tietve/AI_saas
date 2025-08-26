// src/app/api/auth/reset/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sha256, hashPassword } from "@/lib/crypto";

const ResetSchema = z
    .object({
        token: z.string().min(1),
        newPassword: z.string().min(8),
        confirmPassword: z.string().min(8),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "Mật khẩu xác nhận không khớp.",
    });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = ResetSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 400 });
        }

        const { token, newPassword } = parsed.data;
        const tokenHash = sha256(token);

        const rec = await prisma.passwordResetToken.findUnique({
            where: { tokenHash },
        });
        if (!rec) {
            return NextResponse.json({ code: "TOKEN_INVALID" }, { status: 400 });
        }
        if (rec.expiresAt.getTime() < Date.now()) {
            await prisma.passwordResetToken.delete({ where: { tokenHash } });
            return NextResponse.json({ code: "TOKEN_EXPIRED" }, { status: 410 });
        }

        const passwordHash = await hashPassword(newPassword);

        // Đổi mật khẩu và xoá token
        await prisma.$transaction([
            prisma.user.update({
                where: { id: rec.userId },
                data: { passwordHash },
            }),
            prisma.passwordResetToken.delete({ where: { tokenHash } }),
        ]);

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        console.error("/api/auth/reset error:", err);
        return NextResponse.json({ code: "INTERNAL" }, { status: 500 });
    }
}
