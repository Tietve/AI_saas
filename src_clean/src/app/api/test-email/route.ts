
import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function GET() {
    try {
        
        const transporter = nodemailer.createTransport({
            host: "127.0.0.1",
            port: 1025,
            secure: false,
            
        })

        
        await transporter.verify()
        console.log("✅ SMTP connection OK")

        
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