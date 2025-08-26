import { sendEmail } from "./mailer";

export async function sendVerifyEmail(to: string, verifyUrl: string) {
    const subject = "Verify your email";
    const text = `Verify: ${verifyUrl}`;
    const html = `<p>Verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`;
    await sendEmail(to, subject, html, text);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
    const subject = "Reset your password";
    const text = `Reset: ${resetUrl}`;
    const html = `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`;
    await sendEmail(to, subject, html, text);
}
