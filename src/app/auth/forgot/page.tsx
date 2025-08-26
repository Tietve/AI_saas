// src/app/auth/forgot/page.tsx
"use client";
import { useState } from "react";

export default function ForgotPage() {
    const [email, setEmail] = useState("");
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErr("Email không hợp lệ.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) setDone(true);
            else setErr("Có lỗi xảy ra. Vui lòng thử lại.");
        } catch {
            setErr("Không thể kết nối máy chủ.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid place-items-center bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100 p-6">
            <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow p-8">
                <h1 className="text-xl font-bold">Quên mật khẩu</h1>
                <p className="mt-2 text-sm text-neutral-600">
                    Nhập email để nhận liên kết đặt lại mật khẩu.
                </p>

                {done ? (
                    <p className="mt-4 text-sm text-emerald-700">
                        Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại. Kiểm tra hộp thư của bạn.
                    </p>
                ) : (
                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input
                                className="mt-1 w-full border rounded-lg p-2"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.trim())}
                                placeholder="ban@vidu.com"
                                required
                            />
                        </div>
                        {err && <p className="text-sm text-red-600">{err}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-emerald-600 text-white py-2 hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {loading ? "Đang gửi…" : "Gửi liên kết đặt lại"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
