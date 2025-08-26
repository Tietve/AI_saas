import nodemailer from "nodemailer";

/** Trả về transporter kết nối tới SMTP.
 *  - Nếu không có biến môi trường, fallback về MailHog (localhost:1025).
 *  - Dùng được cho cả verify và reset.
 */
export function getTransport() {
    const host = process.env.SMTP_HOST || "localhost";
    const port = Number(process.env.SMTP_PORT || 1025);
    const secure = String(process.env.SMTP_SECURE || "false") === "true"; // MailHog: false
    const user = process.env.SMTP_USER || undefined;
    const pass = process.env.SMTP_PASS || undefined;

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
        tls: { rejectUnauthorized: false }, // để dev cho “thoáng”
    });
}

/** Gửi email chung */
export async function sendEmail(to: string, subject: string, html: string, text?: string) {
    const tx = getTransport();
    await tx.verify(); // nếu sai host/port → ném lỗi rõ ràng thay vì 500 mù mờ
    const from = process.env.SMTP_FROM || "Your App <no-reply@localhost>";
    const info = await tx.sendMail({ from, to, subject, text, html });
    console.log("MAIL_SENT", info.messageId);
}
