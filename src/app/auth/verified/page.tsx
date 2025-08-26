import Link from "next/link";


export default function VerifiedPage(){
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100 p-6">
            <div className="w-full max-w-md text-center bg-white/90 backdrop-blur rounded-2xl shadow p-8">
                <h1 className="text-2xl font-bold text-emerald-700">Email đã được xác minh 🎉</h1>
                <p className="mt-2 text-sm text-neutral-600">Tài khoản của bạn đã sẵn sàng.</p>
                <Link href="/auth/signin" className="inline-block mt-6 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Đăng nhập</Link>
            </div>
        </div>
    );
}