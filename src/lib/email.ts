// src/lib/email.ts
import nodemailer from "nodemailer";

const {
    SMTP_HOST = "127.0.0.1",
    SMTP_PORT = "1025",
    SMTP_SECURE = "false",
    SMTP_USER = "",
    SMTP_PASS = "",
    SMTP_FROM = "AI SaaS <no-reply@local.test>",
    APP_URL = "http://localhost:3000",
} = process.env as Record<string, string>;

const isSecure = SMTP_SECURE === "true";

// Singleton (tạo duy nhất 1 transporter để tái sử dụng; tránh tạo lại mỗi request)
const globalForMailer = global as unknown as {
    _transporter?: ReturnType<typeof nodemailer.createTransport>;
};

export const transporter =
    globalForMailer._transporter ??
    nodemailer.createTransport({
        host: SMTP_HOST || "127.0.0.1",
        port: Number(SMTP_PORT || "1025"),
        secure: isSecure, // MailHog => false (không TLS)
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined, // MailHog => undefined (không auth)
    });

if (process.env.NODE_ENV !== "production" && !globalForMailer._transporter) {
    globalForMailer._transporter = transporter;
    console.log("[SMTP CFG]", {
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: isSecure,
        hasAuth: !!SMTP_USER,
    });
    transporter
        .verify()
        .then(() => console.log("[SMTP] OK, ready"))
        .catch((e) => console.error("[SMTP] FAILED", e)); // sẽ cho bạn thấy lỗi thật nếu có
}

export async function sendVerificationEmail(to: string, token: string) {
    const url = `${APP_URL}/auth/verify?token=${encodeURIComponent(token)}`;
    return transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject: "Xác minh email tài khoản",
        html: `
      <p>Chào bạn,</p>
      <p>Nhấn để xác minh: <a href="${url}">${url}</a></p>
      <p>Nếu không click được, copy link: ${url}</p>
    `,
    });
}

export async function sendPasswordResetEmail(to: string, token: string) {
    const url = `${APP_URL}/auth/reset?token=${encodeURIComponent(token)}`;
    return transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject: "Đặt lại mật khẩu",
        html: `
      <p>Chào bạn,</p>
      <p>Nhấn để đặt lại mật khẩu: <a href="${url}">${url}</a></p>
      <p>Nếu không click được, copy link: ${url}</p>
      <p>Liên kết sẽ hết hạn sau 30 phút.</p>
    `,
    });
}
