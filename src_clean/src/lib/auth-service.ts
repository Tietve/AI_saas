
import { prisma } from "@/lib/prisma";
import { normalizeEmail, hashPassword, randomToken, sha256 } from "@/lib/crypto";

export class ValidationError extends Error {
    code = "VALIDATION_ERROR" as const;
    field?: string;
    constructor(message: string, field?: string) {
        super(message);
        this.field = field;
    }
}
export class ConflictError extends Error {
    code = "CONFLICT" as const;
}
export class NotFoundError extends Error {
    code = "NOT_FOUND" as const;
}

export type CreateUserInput = {
    email: string;
    password: string;
};

export type CreateUserResult = {
    userId: string;
    verificationToken: string; 
    expiresAt: Date;
};

export async function createUserWithVerification(
    input: CreateUserInput
): Promise<CreateUserResult> {
    const email = input.email;
    const emailLower = normalizeEmail(email);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ValidationError("Email không hợp lệ", "email");
    }
    if ((input.password ?? "").length < 8) {
        throw new ValidationError("Mật khẩu phải có ít nhất 8 ký tự", "password");
    }

    
    const existing = await prisma.user.findFirst({ where: { emailLower } });
    if (existing?.emailVerifiedAt) {
        
        throw new ConflictError("Email đã tồn tại");
    }

    const passwordHash = await hashPassword(input.password);

    
    const user = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: { passwordHash },
        })
        : await prisma.user.create({
            data: { email, emailLower, passwordHash },
        });

    
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

    const rawToken = randomToken(32);
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); 

    await prisma.emailVerificationToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
    });

    
    return { userId: user.id, verificationToken: rawToken, expiresAt };
}

export async function verifyEmailByToken(rawToken: string) {
    const tokenHash = sha256(rawToken);
    const rec = await prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
    });
    if (!rec) throw new NotFoundError("Token không hợp lệ");
    if (rec.expiresAt.getTime() < Date.now()) {
        
        await prisma.emailVerificationToken.delete({ where: { tokenHash } });
        throw new ValidationError("Token đã hết hạn");
    }

    await prisma.$transaction([
        prisma.user.update({
            where: { id: rec.userId },
            data: { emailVerifiedAt: new Date() },
        }),
        prisma.emailVerificationToken.delete({ where: { tokenHash } }),
    ]);

    return { ok: true as const };
}

export async function resendVerification(email: string) {
    const emailLower = normalizeEmail(email);
    const user = await prisma.user.findFirst({ where: { emailLower } });

    
    if (!user) return { ok: true as const };
    if (user.emailVerifiedAt) return { ok: true as const };

    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

    const rawToken = randomToken(32);
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.emailVerificationToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
    });

    return { ok: true as const, verificationToken: rawToken, expiresAt };
}
