
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
    const router = useRouter();
    const [showHelp, setShowHelp] = useState(false);

    const handleRetry = () => {
        
        router.push('/chat');
        
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                <div className="flex flex-col items-center text-center">
                    {}
                    <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6">
                        <XCircle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
                    </div>

                    {}
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Thanh toán đã bị hủy
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Bạn đã hủy quá trình thanh toán. Không có khoản phí nào được tính.
                    </p>

                    {}
                    <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 text-left">
                                <p className="font-medium mb-1">Bạn vẫn có thể nâng cấp bất cứ lúc nào</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Gói miễn phí của bạn vẫn hoạt động bình thường với 20 tin nhắn/ngày
                                </p>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Link
                            href="/chat"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại chat
                        </Link>
                        <button
                            onClick={handleRetry}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Thử lại
                        </button>
                    </div>

                    {}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 w-full">
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition w-full"
                        >
                            <HelpCircle className="w-4 h-4" />
                            Bạn gặp vấn đề khi thanh toán?
                        </button>

                        {showHelp && (
                            <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Các vấn đề thường gặp:
                                </p>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-400">•</span>
                                        <span>
                      <strong>Số dư không đủ:</strong> Kiểm tra tài khoản ví điện tử của bạn
                    </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-400">•</span>
                                        <span>
                      <strong>Lỗi kết nối:</strong> Thử lại với kết nối internet ổn định
                    </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-gray-400">•</span>
                                        <span>
                      <strong>Hết thời gian:</strong> Phiên thanh toán có thể hết hạn sau 15 phút
                    </span>
                                    </li>
                                </ul>
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Vẫn cần trợ giúp?{' '}
                                        <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                                            Liên hệ hỗ trợ
                                        </a>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}