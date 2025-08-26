// src/app/auth/reset/page.tsx
"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const token = sp.get("token") || "";

    const [pw, setPw] = useState("");
    const [cf, setCf] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setMsg(null);

        if (!token) {
            setErr("Liên kết không hợp lệ.");
            return;
        }
        if (pw.length < 8) {
            setErr("Mật khẩu phải có ít nhất 8 ký tự.");
            return;
        }
        if (pw !== cf) {
            setErr("Mật khẩu xác nhận không khớp.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: pw, confirmPassword: cf }),
            });

            if (res.ok) {
                setMsg("Đặt lại thành công! Bạn có thể đăng nhập.");
                setTimeout(() => router.push("/auth/login"), 1200);
            } else if (res.status === 410) {
                setErr("Liên kết đã hết hạn. Vui lòng yêu cầu lại.");
            } else if (res.status === 400) {
                setErr("Liên kết không hợp lệ.");
            } else {
                setErr("Có lỗi xảy ra. Vui lòng thử lại.");
            }
        } catch {
            setErr("Không thể kết nối máy chủ.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid place-items-center bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100 p-6">
            <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow p-8">
                <h1 className="text-xl font-bold">Đặt lại mật khẩu</h1>
                <p className="mt-2 text-sm text-neutral-600">
                    Nhập mật khẩu mới cho tài khoản của bạn.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium">Mật khẩu mới</label>
                        <input
                            className="mt-1 w-full border rounded-lg p-2"
                            type="password"
                            value={pw}
                            onChange={(e) => setPw(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Xác nhận mật khẩu</label>
                        <input
                            className="mt-1 w-full border rounded-lg p-2"
                            type="password"
                            value={cf}
                            onChange={(e) => setCf(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {err && <p className="text-sm text-red-600">{err}</p>}
                    {msg && <p className="text-sm text-emerald-700">{msg}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-emerald-600 text-white py-2 hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {loading ? "Đang đặt lại…" : "Đặt lại mật khẩu"}
                    </button>
                </form>
            </div>
        </div>
    );
}
