import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/crypto";
import { createSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ code: "BAD_REQUEST" }, { status: 400 });
        }

        const emailLower = String(email).trim().toLowerCase();
        const user = await prisma.user.findFirst({ where: { emailLower } });
        if (!user) {
            return NextResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
        }

        if (!user.emailVerifiedAt) {
            return NextResponse.json({ code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
        }

        // LƯU Ý: verifyPassword(plain, hash)
        const ok = await verifyPassword(String(password), user.passwordHash);
        if (!ok) {
            return NextResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
        }

        const { name, value, options } = await createSessionCookie({
            uid: user.id,
            email: user.email,
        });

        const res = NextResponse.json({ ok: true }, { status: 200 });
        res.cookies.set(name, value, options as any);
        return res;
    } catch (err) {
        console.error("/api/auth/signin error:", err);
        return NextResponse.json({ code: "INTERNAL" }, { status: 500 });
    }
}
