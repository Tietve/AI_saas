"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const form = new FormData(e.currentTarget);
        const email = String(form.get("email") || "").trim();
        const password = String(form.get("password") || "");
        const confirm = String(form.get("confirm") || "");
        const agree = Boolean(form.get("agree"));

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Email không hợp lệ.");
            return;
        }
        if (password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự.");
            return;
        }
        if (password !== confirm) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }
        if (!agree) {
            setError("Bạn phải đồng ý với điều khoản sử dụng.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    confirmPassword: confirm,
                    acceptTerms: true
                }),
            });

            if (res.ok) {
                // Điều hướng sang trang “Kiểm tra email”
                window.location.href = "/auth/check-email?email=" + encodeURIComponent(email);
                return;
            }

            const data = await res.json().catch(() => ({} as any));
            if (res.status === 409 || data?.code === "EMAIL_EXISTS") {
                setError("Email đã đăng ký. Vui lòng dùng email khác hoặc đăng nhập.");
            } else if (res.status === 400 && data?.code === "VALIDATION_ERROR") {
                setError("Thông tin không hợp lệ. Vui lòng kiểm tra lại.");
            } else if (res.status === 429) {
                setError("Bạn thao tác quá nhanh. Vui lòng thử lại sau.");
            } else {
                setError("Có lỗi xảy ra. Vui lòng thử lại.");
            }
        } catch {
            setError("Không thể kết nối máy chủ. Kiểm tra mạng hoặc server.");
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100">
            {/* Pattern */}
            <div
                aria-hidden
                className="absolute inset-0 opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent)]"
                style={{ backgroundImage: "url(/pattern.svg)", backgroundSize: "32px 32px" }}
            />

            {/* Radial glow */}
            <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-emerald-200 opacity-30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-sky-200 opacity-30 blur-3xl" />

            <Card className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200/70 bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)]">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight text-neutral-900">Đăng ký</CardTitle>
                    <p className="mt-1 text-sm text-neutral-600">Tạo tài khoản mới</p>
                </CardHeader>
                <CardContent>
                    <form className="space-y-5" onSubmit={handleSignUp} noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="ban@vidu.com" required aria-invalid={!!error && error.toLowerCase().includes("email")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <div className="relative">
                                <Input id="password" name="password" type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" required className="pr-10" />
                                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute inset-y-0 right-2 inline-flex items-center justify-center px-2 text-neutral-500 hover:text-neutral-700" aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
                            <div className="relative">
                                <Input id="confirm" name="confirm" type={showConfirmPw ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" required className="pr-10" />
                                <button type="button" onClick={() => setShowConfirmPw((v) => !v)} className="absolute inset-y-0 right-2 inline-flex items-center justify-center px-2 text-neutral-500 hover:text-neutral-700" aria-label={showConfirmPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox id="agree" name="agree" />
                            <label htmlFor="agree" className="text-sm text-neutral-700">
                                Tôi đồng ý với <Link href="/terms" className="text-emerald-700 hover:underline">Điều khoản sử dụng</Link>
                            </label>
                        </div>

                        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo tài khoản…
                </span>
                            ) : (
                                "Đăng ký"
                            )}
                        </Button>
                    </form>

                    <p className="mt-4 text-center text-sm text-neutral-700">
                        Đã có tài khoản? <Link href="/auth/signin" className="font-medium text-emerald-700 hover:underline">Đăng nhập</Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
