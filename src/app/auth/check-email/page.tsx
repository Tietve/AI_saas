"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function CheckEmailPage() {
    const sp = useSearchParams();
    const email = sp.get("email") || "";
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const masked = email.replace(/(^.).+(@.+$)/, "$1***$2");

    async function resend() {
        if (!email) return;
        setLoading(true);
        await fetch("/api/auth/resend-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        }).catch(() => {});
        setLoading(false);
        setDone(true);
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <h1 className="text-2xl font-bold">Kiểm tra email</h1>
                <p className="mt-2">Chúng tôi đã gửi liên kết xác minh tới <b>{masked}</b>.</p>
                <button
                    onClick={resend}
                    disabled={loading}
                    className="mt-4 px-4 py-2 rounded bg-emerald-600 text-white"
                >
                    {loading ? "Đang gửi…" : "Gửi lại email xác minh"}
                </button>
                {done && <p className="text-sm mt-2">Đã gửi lại. Vui lòng kiểm tra hộp thư.</p>}
            </div>
        </div>
    );
}
