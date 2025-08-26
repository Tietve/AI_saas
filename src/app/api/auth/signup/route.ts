// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createUserWithVerification } from "@/lib/auth-service";
import { sendVerificationEmail } from "@/lib/email"; // <-- thêm dòng này

const SignupSchema = z
    .object({
        email: z.string().email(),
        password: z.string().min(8),
        confirmPassword: z.string().min(8),
        acceptTerms: z.boolean(),
    })
    .refine((d) => d.acceptTerms === true, {
        path: ["acceptTerms"],
        message: "Bạn phải đồng ý điều khoản.",
    })
    .refine((d) => d.password === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "Mật khẩu xác nhận không khớp.",
    });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = SignupSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { code: "VALIDATION_ERROR", issues: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { email, password } = parsed.data;
        const { verificationToken } = await createUserWithVerification({ email, password });

        // GỬI EMAIL qua MailHog (SMTP local) hoặc Resend tuỳ bạn cấu hình trong src/lib/email.ts
        await sendVerificationEmail(email, verificationToken);

        // (Tuỳ: vẫn log token ra console để debug)
        // console.log("[DEV] Verify token:", verificationToken);

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (e: any) {
        const code = e?.code;
        if (code === "CONFLICT") {
            return NextResponse.json({ code: "EMAIL_EXISTS" }, { status: 409 });
        }
        if (code === "VALIDATION_ERROR") {
            return NextResponse.json(
                { code: e.code, message: e.message, field: e.field },
                { status: 400 }
            );
        }
        console.error("/api/auth/signup error:", e?.message || e);
        return NextResponse.json({ code: "INTERNAL" }, { status: 500 });
    }
}
