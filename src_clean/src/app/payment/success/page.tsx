
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isVerifying, setIsVerifying] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'error' | null>(null);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        
        const orderCode = searchParams.get('orderCode');
        const status = searchParams.get('status');
        const id = searchParams.get('id');

        
        async function verifyPayment() {
            if (!orderCode) {
                setPaymentStatus('error');
                setIsVerifying(false);
                return;
            }

            try {
                const response = await fetch(`/api/payment/create?orderCode=${orderCode}`, {
                    method: 'GET'
                });

                const data = await response.json();

                if (data.success && data.data.status === 'SUCCESS') {
                    setPaymentStatus('success');
                } else {
                    setPaymentStatus('error');
                }
            } catch (error) {
                console.error('Error verifying payment:', error);
                setPaymentStatus('error');
            } finally {
                setIsVerifying(false);
            }
        }

        verifyPayment();
    }, [searchParams]);

    
    useEffect(() => {
        if (paymentStatus === 'success') {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        router.push('/chat');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [paymentStatus, router]);

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                    <div className="flex flex-col items-center text-center">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Đang xác thực thanh toán...
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Vui lòng đợi trong giây lát
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (paymentStatus === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Có lỗi xảy ra
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Không thể xác thực thanh toán của bạn. Vui lòng thử lại hoặc liên hệ hỗ trợ.
                        </p>
                        <div className="flex gap-3">
                            <Link
                                href="/chat"
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            >
                                Về trang chat
                            </Link>
                            <button
                                onClick={() => router.push('/payment/retry')}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Thử lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                {}
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-bounce-slow">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        {}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="confetti-container">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="confetti"
                                        style={{
                                            background: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3'][i],
                                            left: `${Math.random() * 100}%`,
                                            animationDelay: `${Math.random() * 0.5}s`,
                                            animationDuration: `${2 + Math.random()}s`
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Thanh toán thành công! 🎉
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Chúc mừng bạn đã nâng cấp lên gói <span className="font-semibold text-purple-600">Plus</span>
                    </p>

                    {}
                    <div className="w-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-6">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bạn đã mở khóa:
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span> Không giới hạn tin nhắn
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span> Truy cập tất cả AI models
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span> Ưu tiên xử lý nhanh
                            </li>
                        </ul>
                    </div>

                    {}
                    <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                        Tự động chuyển về trang chat sau {countdown} giây...
                    </div>

                    {}
                    <Link
                        href="/chat"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                    >
                        Bắt đầu trải nghiệm
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall linear infinite;
        }
        
        @keyframes confetti-fall {
          to {
            transform: translateY(120px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}