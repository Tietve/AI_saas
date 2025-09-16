"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, Github, Mail } from "lucide-react";

export default function SignInPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPw, setShowPw] = useState(false);
    // shadcn Checkbox không đi vào FormData → dùng state
    const [remember, setRemember] = useState(false);

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        setError(null);

        const form = new FormData(e.currentTarget);
        const email = String(form.get("email") || "").trim();
        const password = String(form.get("password") || "");

        // validate nhanh phía client (API vẫn kiểm tra lần nữa)
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Email không hợp lệ.");
            return;
        }
        if (password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, remember }), // TODO: nếu muốn remember ảnh hưởng maxAge cookie, chỉnh ở backend
            });

            if (res.ok) {
                // vào app – đổi đường dẫn này theo cấu trúc của bạn
                router.push("/chat");
                return;
            }

            const data = await res.json().catch(() => ({} as any));
            if (res.status === 401 && data?.code === "INVALID_CREDENTIALS") {
                setError("Email hoặc mật khẩu không đúng.");
            } else if (res.status === 403 && data?.code === "EMAIL_NOT_VERIFIED") {
                setError("Email chưa xác minh. Vui lòng kiểm tra hộp thư hoặc gửi lại liên kết.");
            } else if (res.status === 400 && data?.code === "BAD_REQUEST") {
                setError("Thiếu thông tin đăng nhập.");
            } else {
                setError("Có lỗi xảy ra. Vui lòng thử lại.");
            }
        } catch (err: any) {
            setError(err?.message || "Không thể kết nối server.");
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
                    <CardTitle className="text-2xl font-bold tracking-tight text-neutral-900">Đăng nhập</CardTitle>
                    <p className="mt-1 text-sm text-neutral-600">Chào mừng bạn quay trở lại chat</p>
                </CardHeader>
                <CardContent>
                    <form className="space-y-5" onSubmit={handleLogin} noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                placeholder="ban@vidu.com"
                                required
                                disabled={loading}
                                aria-invalid={!!error && /email|địa chỉ/i.test(error)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPw ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                    aria-invalid={!!error && /mật khẩu/i.test(error)}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw((v) => !v)}
                                    className="absolute inset-y-0 right-2 inline-flex items-center justify-center px-2 text-neutral-500 hover:text-neutral-700"
                                    aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    tabIndex={-1}
                                >
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-neutral-700">
                                <Checkbox
                                    id="remember"
                                    checked={remember}
                                    onCheckedChange={(v) => setRemember(Boolean(v))}
                                />
                                Ghi nhớ tôi
                            </label>
                            <Link href="/auth/forgot" className="text-sm text-emerald-700 hover:underline">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        {error && (
                            <p role="alert" aria-live="polite" className="text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang đăng nhập…
                </span>
                            ) : (
                                "Đăng nhập"
                            )}
                        </Button>

                        {/* Social sign-in (đang để TODO) */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={loading}
                                onClick={() => alert("TODO: OAuth Google")}
                            >
                                <Mail className="mr-2 h-4 w-4" /> Google
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={loading}
                                onClick={() => alert("TODO: OAuth GitHub")}
                            >
                                <Github className="mr-2 h-4 w-4" /> GitHub
                            </Button>
                        </div>
                    </form>

                    <p className="mt-4 text-center text-sm text-neutral-700">
                        Chưa có tài khoản?{" "}
                        <Link href="/auth/signup" className="font-medium text-emerald-700 hover:underline">
                            Đăng ký ngay
                        </Link>
                    </p>

                    <p className="mt-2 text-center text-xs text-neutral-500">
                        Mẹo: dùng trình quản lý mật khẩu để điền nhanh và an toàn hơn.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
