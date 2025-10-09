
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export const dynamic = 'force-dynamic'

export default function VerifyPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const token = sp.get("token") || "";
    const [status, setStatus] = useState<"idle" | "loading" | "ok" | "expired" | "invalid" | "error">("idle");

    useEffect(() => {
        const run = async () => {
            if (!token) {
                setStatus("invalid");
                return;
            }
            setStatus("loading");
            try {
                const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { method: "GET" });
                if (res.ok) {
                    setStatus("ok");
                    setTimeout(() => router.push("/auth/verified"), 1000);
                } else if (res.status === 410) {
                    setStatus("expired");
                } else if (res.status === 400) {
                    setStatus("invalid");
                } else {
                    setStatus("error");
                }
            } catch {
                setStatus("error");
            }
        };
        run();
    }, [token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100 p-6">
            <div className="w-full max-w-md text-center bg-white/90 backdrop-blur rounded-2xl shadow p-8">
                {status === "loading" && (
                    <>
                        <h1 className="text-xl font-bold">Đang xác minh…</h1>
                        <p className="mt-2 text-sm text-neutral-600">Vui lòng đợi trong giây lát.</p>
                    </>
                )}

                {status === "ok" && (
                    <>
                        <h1 className="text-xl font-bold text-emerald-700">Xác minh thành công!</h1>
                        <p className="mt-2 text-sm text-neutral-600">Đang chuyển đến trang hoàn tất…</p>
                        <p className="mt-4 text-sm">
                            <Link className="text-emerald-700 underline" href="/auth/verified">
                                Nhấn vào đây nếu không tự chuyển
                            </Link>
                        </p>
                    </>
                )}

                {status === "expired" && (
                    <>
                        <h1 className="text-xl font-bold text-amber-700">Liên kết đã hết hạn</h1>
                        <p className="mt-2 text-sm text-neutral-600">Vui lòng yêu cầu gửi lại email xác minh.</p>
                        <p className="mt-4 text-sm">
                            <Link className="text-emerald-700 underline" href="/auth/check-email">
                                Gửi lại email xác minh
                            </Link>
                        </p>
                    </>
                )}

                {status === "invalid" && (
                    <>
                        <h1 className="text-xl font-bold text-red-700">Liên kết không hợp lệ</h1>
                        <p className="mt-2 text-sm text-neutral-600">Token không đúng hoặc thiếu tham số.</p>
                        <p className="mt-4 text-sm">
                            <Link className="text-emerald-700 underline" href="/auth/check-email">
                                Quay lại trang kiểm tra email
                            </Link>
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <h1 className="text-xl font-bold text-red-700">Có lỗi xảy ra</h1>
                        <p className="mt-2 text-sm text-neutral-600">Vui lòng thử lại hoặc gửi lại email xác minh.</p>
                        <p className="mt-4 text-sm">
                            <Link className="text-emerald-700 underline" href="/auth/check-email">
                                Quay lại trang kiểm tra email
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
