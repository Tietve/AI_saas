import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";


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