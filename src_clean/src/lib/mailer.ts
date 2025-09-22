import nodemailer from "nodemailer";


const {
    SMTP_HOST = "127.0.0.1",
    SMTP_PORT = "1025",
    SMTP_USER = "",
    SMTP_PASS = "",
    SMTP_SECURE = "false",
    SMTP_FROM = "AI SaaS <no-reply@local.test>",
} = process.env;


export const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true", 
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});


export async function sendPasswordResetEmail(to: string, url: string) {
    await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject: "Reset your password",
        html: `
<p>We received a request to reset your password.</p>
<p><a href="${url}">Click here to reset</a> (expires in 1 hour).</p>
<p>If you did not request this, you can ignore this email.</p>
`,
        text: `Reset your password: ${url}`,
    });
}