// src/app/api/auth/verify-email/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/crypto";

async function handleVerify(token: string) {
    const tokenHash = sha256(token);

    const rec = await prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
    });

    if (!rec) {
        return NextResponse.json({ code: "TOKEN_INVALID" }, { status: 400 });
    }

    if (rec.expiresAt.getTime() < Date.now()) {
        await prisma.emailVerificationToken.delete({ where: { tokenHash } });
        return NextResponse.json({ code: "TOKEN_EXPIRED" }, { status: 410 });
        // 410 Gone: token hết hạn
    }

    await prisma.$transaction([
        prisma.user.update({
            where: { id: rec.userId },
            data: { emailVerifiedAt: new Date() },
        }),
        prisma.emailVerificationToken.delete({ where: { tokenHash } }),
    ]);

    return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const token = url.searchParams.get("token");
        if (!token) {
            return NextResponse.json({ code: "BAD_REQUEST" }, { status: 400 });
        }
        return await handleVerify(token);
    } catch (err: any) {
        console.error("/api/auth/verify-email GET error:", err?.message);
        return NextResponse.json({ code: "INTERNAL" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { token } = await req.json();
        if (!token || typeof token !== "string") {
            return NextResponse.json({ code: "BAD_REQUEST" }, { status: 400 });
        }
        return await handleVerify(token);
    } catch (err: any) {
        console.error("/api/auth/verify-email POST error:", err?.message);
        return NextResponse.json({ code: "INTERNAL" }, { status: 500 });
    }
}
