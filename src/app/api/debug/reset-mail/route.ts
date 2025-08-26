// src/app/api/debug/reset-mail/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";

export async function GET(req: Request) {
    try {
        const u = new URL(req.url);
        const to = (u.searchParams.get("to") || "test@local.test").trim().toLowerCase();

        // Nếu HÀM của bạn nhận token (không phải url), cứ tạo token giả:
        const token = "debug-token";

        await sendPasswordResetEmail(to, token);  // chú ý: đúng chữ ký (to, token)
        return NextResponse.json({ ok: true, to });
    } catch (e: any) {
        console.error("[DEBUG reset-mail] error", e);
        return NextResponse.json(
            { ok: false, err: String(e?.message || e) },
            { status: 500 }
        );
    }
}
