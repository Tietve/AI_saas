
'use client';

import { useState } from 'react';
import { X, CreditCard, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUsage: {
        dailyMessages: number;
        dailyLimit: number;
    };
    userId?: string;
}

export default function UpgradeModal({
                                         isOpen,
                                         onClose,
                                         currentUsage,
                                         userId
                                     }: UpgradeModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<'zalopay' | 'momo' | 'vnpay' | null>(null);

    const handleUpgrade = async () => {
        if (!selectedMethod) {
            setError('Vui lòng chọn phương thức thanh toán');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const response = await fetch('/api/payment/payos/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planType: 'PLUS',
                    userId: userId,
                    paymentMethod: selectedMethod
                })
            });

            const data = await response.json();

            if (data.success) {
                
                window.location.href = data.checkoutUrl;
            } else {
                setError(data.error || 'Không thể tạo liên kết thanh toán');
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError('Đã xảy ra lỗi, vui lòng thử lại');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
                onClick={onClose}
            />

            {}
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
                <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
                    {}
                    <div className="relative p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Nâng cấp lên Plus
                            </h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Mở khóa toàn bộ sức mạnh của AI
                        </p>
                    </div>

                    {}
                    <div className="px-6 pt-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-amber-900 dark:text-amber-200">
                                        Bạn đã sử dụng hết giới hạn miễn phí
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                        {currentUsage.dailyMessages}/{currentUsage.dailyLimit} tin nhắn hôm nay
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="p-6">
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">279.000</span>
                                <span className="text-gray-600 dark:text-gray-400">VND/tháng</span>
                            </div>

                            <ul className="space-y-3">
                                {[
                                    'Không giới hạn tin nhắn',
                                    'Truy cập GPT-4, Claude, Gemini Pro',
                                    'Ưu tiên xử lý nhanh',
                                    'Hỗ trợ 24/7',
                                    'Xuất file chat và phân tích'
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {}
                    <div className="px-6">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Chọn phương thức thanh toán:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'zalopay', name: 'ZaloPay', color: 'bg-blue-600' },
                                { id: 'momo', name: 'Momo', color: 'bg-pink-500' },
                                { id: 'vnpay', name: 'VNPay', color: 'bg-blue-700' }
                            ].map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id as any)}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        selectedMethod === method.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                >
                                    <div className={`${method.color} w-full h-8 rounded flex items-center justify-center`}>
                                        <span className="text-white text-xs font-bold">{method.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {}
                    {error && (
                        <div className="px-6 mt-4">
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        </div>
                    )}

                    {}
                    <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleUpgrade}
                            disabled={isProcessing || !selectedMethod}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4" />
                                    Thanh toán ngay
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}