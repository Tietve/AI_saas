
"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default function CheckEmailPage() {
    const searchParams = useSearchParams()
    const email = searchParams.get("email") || ""
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    async function resendEmail() {
        if (!email) return

        setLoading(true)
        setMessage("")

        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })

            const data = await res.json()

            if (data.ok) {
                setMessage("Email xác thực đã được gửi lại! Vui lòng kiểm tra hộp thư.")
            } else {
                setMessage(data.error || "Có lỗi xảy ra")
            }
        } catch (error) {
            setMessage("Không thể gửi email")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Kiểm tra email của bạn
                    </h2>

                    <p className="text-gray-600 mb-6">
                        Chúng tôi đã gửi link xác thực đến<br />
                        <strong className="text-gray-900">{email}</strong>
                    </p>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Vui lòng kiểm tra hộp thư và click vào link để xác thực tài khoản.
                            Link sẽ hết hạn sau 30 phút.
                        </p>

                        {message && (
                            <div className={`p-3 rounded text-sm ${
                                message.includes("lỗi")
                                    ? "bg-red-50 text-red-700"
                                    : "bg-green-50 text-green-700"
                            }`}>
                                {message}
                            </div>
                        )}

                        <button
                            onClick={resendEmail}
                            disabled={loading}
                            className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? "Đang gửi..." : "Gửi lại email xác thực"}
                        </button>

                        <div className="pt-4 border-t">
                            <Link href="/auth/signin" className="text-sm text-blue-600 hover:text-blue-500">
                                ← Quay lại đăng nhập
                            </Link>
                        </div>
                    </div>

                    {}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-left">
                            <p className="text-xs text-yellow-800">
                                <strong>Dev Mode:</strong> Check MailHog at{' '}
                                <a href="http://localhost:8025" target="_blank" className="underline">
                                    http:
                                </a>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}