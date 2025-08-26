export const runtime = "nodejs";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
    const {
        SMTP_HOST = "127.0.0.1",
        SMTP_PORT = "1025",
        SMTP_SECURE = "false",
        SMTP_USER = "",
        SMTP_PASS = "",
        SMTP_FROM = "AI SaaS <no-reply@local.test>",
    } = process.env as Record<string, string>;

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === "true",           // MailHog => false
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined, // MailHog => undefined
    });

    try {
        await transporter.verify();               // báo lỗi cấu hình nếu có
        await transporter.sendMail({
            from: SMTP_FROM,
            to: "test@local.test",
            subject: "SMTP debug",
            text: "hello from /api/debug/smtp",
        });

        return NextResponse.json({
            ok: true,
            cfg: { host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, hasAuth: !!SMTP_USER },
        });
    } catch (e: any) {
        return NextResponse.json({
            ok: false,
            error: String(e?.message || e),
            cfg: { host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, hasAuth: !!SMTP_USER },
        }, { status: 500 });
    }
}
