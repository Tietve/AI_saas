import crypto from "crypto";
import * as argon2 from "argon2"; // đảm bảo đã: npm i argon2

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
    // Tuỳ chọn tham số argon2 (memoryCost/timeCost/parallelism) nếu muốn
    return argon2.hash(plain);
}

/**
 * So khớp mật khẩu: plain người dùng nhập, hash lưu trong DB
 * LƯU Ý: argon2.verify(hash, plain)
 */
export async function verifyPassword(plain: string, hash: string) {
    return argon2.verify(hash, plain);
}
