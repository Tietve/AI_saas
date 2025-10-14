
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "127.0.0.1",
    port: Number(process.env.SMTP_PORT || "1025"),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    } : undefined,
})


// Only verify in runtime, not during build
// Skip during build and SSR
if (process.env.NODE_ENV === "development" &&
    typeof window === "undefined" &&
    !process.env.BUILDING &&
    !process.env.CI &&
    !process.env.VERCEL) {
    transporter.verify()
        .then(() => console.log("✅ [Email] MailHog connected"))
        .catch((e) => console.error("❌ [Email] MailHog error:", e.message))
}

export async function sendVerificationEmail(to: string, token: string) {
    const url = `${process.env.APP_URL || "http://localhost:3000"}/auth/verify?token=${encodeURIComponent(token)}`

    console.log(`[Email] Sending verification to ${to}`)

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || "AI Chat <noreply@localhost>",
            to,
            subject: "Xác minh email của bạn",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Xác minh tài khoản</h2>
                    <p>Cảm ơn bạn đã đăng ký! Vui lòng xác minh email của bạn.</p>
                    <p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">
                            Xác minh email
                        </a>
                    </p>
                    <p>Hoặc copy link sau:</p>
                    <p style="background: #f3f4f6; padding: 10px; word-break: break-all;">
                        ${url}
                    </p>
                    <p>Link sẽ hết hạn sau 30 phút.</p>
                </div>
            `,
            text: `Xác minh email tại: ${url}`
        })
        console.log(`✅ [Email] Sent to ${to}`)
        return true
    } catch (error) {
        console.error(`❌ [Email] Failed to send to ${to}:`, error)
        throw error
    }
}

export async function sendPasswordResetEmail(to: string, token: string) {
    const url = `${process.env.APP_URL || "http://localhost:3000"}/auth/reset?token=${encodeURIComponent(token)}`

    await transporter.sendMail({
        from: process.env.SMTP_FROM || "AI Chat <noreply@localhost>",
        to,
        subject: "Đặt lại mật khẩu",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Đặt lại mật khẩu</h2>
                <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
                <p>
                    <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">
                        Đặt lại mật khẩu
                    </a>
                </p>
                <p>Link sẽ hết hạn sau 1 giờ.</p>
            </div>
        `
    })
}