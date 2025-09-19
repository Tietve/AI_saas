// src/app/api/test-email/route.ts
import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function GET() {
    try {
        // Config cho MailHog
        const transporter = nodemailer.createTransport({
            host: "127.0.0.1",
            port: 1025,
            secure: false,
            // Không cần auth với MailHog
        })

        // Test connection
        await transporter.verify()
        console.log("✅ SMTP connection OK")

        // Send test email
        await transporter.sendMail({
            from: "test@localhost",
            to: "user@example.com",
            subject: "Test Email",
            html: "<h1>Test từ Next.js</h1><p>Nếu bạn thấy email này, MailHog hoạt động!</p>"
        })

        return NextResponse.json({
            ok: true,
            message: "Email sent! Check http://localhost:8025"
        })
    } catch (error: any) {
        console.error("❌ Email error:", error)
        return NextResponse.json({
            ok: false,
            error: error.message
        }, { status: 500 })
    }
}