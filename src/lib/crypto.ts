import crypto from "crypto";
import * as argon2 from "argon2"; // đảm bảo đã: npm i argon2
import bcrypt from "bcryptjs";

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

export function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString("hex");
}

export function sha256(input: string) {
    return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Hash mật khẩu bằng Argon2
 */
export async function hashPassword(plain: string) {
    return bcrypt.hash(plain, 12); // 12 rounds is a good default
}

/**
 * So khớp mật khẩu: plain người dùng nhập, hash lưu trong DB
 * LƯU Ý: argon2.verify(hash, plain)
 */
export async function verifyPassword(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
}
export function generateResetToken(hoursValid = 1) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000);
    return { token, tokenHash, expiresAt };
}
