/**
 * Email Test Script
 * Run: NODE_ENV=production tsx test-email.ts
 */

import nodemailer from "nodemailer"
import * as dotenv from "dotenv"

// Load production environment
dotenv.config({ path: ".env.production" })

async function testEmail() {
    console.log("🧪 Testing email configuration...\n")

    // Show config (hide password)
    console.log("📧 SMTP Configuration:")
    console.log("  Host:", process.env.SMTP_HOST)
    console.log("  Port:", process.env.SMTP_PORT)
    console.log("  User:", process.env.SMTP_USER)
    console.log("  Pass:", process.env.SMTP_PASS ? "****" + process.env.SMTP_PASS.slice(-4) : "NOT SET")
    console.log("  From:", process.env.SMTP_FROM)
    console.log("  Secure:", process.env.SMTP_SECURE)
    console.log()

    // Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
        },
    })

    // Test connection
    console.log("🔗 Testing SMTP connection...")
    try {
        await transporter.verify()
        console.log("✅ SMTP connection successful!\n")
    } catch (error: any) {
        console.error("❌ SMTP connection failed:", error.message)
        return
    }

    // Send test email
    const testEmail = process.env.SMTP_USER || "test@example.com"
    console.log(`📤 Sending test email to: ${testEmail}`)

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || "FirBox <noreply@firbox.net>",
            to: testEmail,
            subject: "🧪 Test Email - FirBox",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #3B82F6;">✅ Email Configuration Test</h2>
                    <p>Chúc mừng! Cấu hình email SMTP của bạn đã hoạt động.</p>
                    <p><strong>Thông tin:</strong></p>
                    <ul>
                        <li>Server: ${process.env.SMTP_HOST}</li>
                        <li>Port: ${process.env.SMTP_PORT}</li>
                        <li>Secure: ${process.env.SMTP_SECURE}</li>
                    </ul>
                    <p style="color: #666; font-size: 12px; margin-top: 40px;">
                        Sent at: ${new Date().toLocaleString("vi-VN")}
                    </p>
                </div>
            `,
            text: `✅ Email configuration test successful! Your SMTP is working correctly.`
        })

        console.log("✅ Test email sent successfully!")
        console.log("📨 Message ID:", info.messageId)
        console.log("\n🎉 Email hoạt động tốt! Kiểm tra inbox của bạn.")
    } catch (error: any) {
        console.error("❌ Failed to send email:", error.message)
    }
}

testEmail().catch(console.error)
