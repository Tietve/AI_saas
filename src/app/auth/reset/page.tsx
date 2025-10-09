
"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export const dynamic = 'force-dynamic'

export default function ResetPage() {
    const params = useSearchParams();
    const token = params.get("token");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);


    if (!token) return <div className="p-6">Token không hợp lệ.</div>;


    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null); setLoading(true);
        try {
            const res = await fetch("/api/auth/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const json = await res.json();
            if (json.ok) setMsg("Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.");
            else setMsg(json.error || "Có lỗi xảy ra.");
        } catch {
            setMsg("Không thể kết nối máy chủ.");
        } finally { setLoading(false); }
    }


    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-xl font-semibold mb-4">Đặt lại mật khẩu</h1>
            <form onSubmit={onSubmit} className="space-y-4">
                <input
                    type="password"
                    placeholder="Mật khẩu mới (≥ 8 ký tự)"
                    className="w-full border rounded p-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                />
                <button disabled={loading} className="w-full border rounded p-2">
                    {loading ? "Đang xử lý…" : "Đổi mật khẩu"}
                </button>
                {msg && <p className="text-sm">{msg}</p>}
            </form>
        </div>
    );
}