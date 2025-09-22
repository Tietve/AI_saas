// app/pricing/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PricingPlan {
    id: 'free' | 'plus' | 'pro';
    name: string;
    price: string;
    priceMonthly: number;
    description: string;
    popular?: boolean;
    features: {
        text: string;
        included: boolean;
    }[];
    buttonText: string;
    buttonVariant: 'outline' | 'primary' | 'premium';
}

const pricingPlans: PricingPlan[] = [
    {
        id: 'free',
        name: 'Free',
        price: '0đ',
        priceMonthly: 0,
        description: 'Dùng thử cơ bản',
        features: [
            { text: '20 tin nhắn mỗi ngày', included: true },
            { text: 'GPT-4o Mini', included: true },
            { text: 'Lưu lịch sử chat 7 ngày', included: true },
            { text: 'Tất cả AI models', included: false },
            { text: 'Ưu tiên xử lý', included: false },
            { text: 'Xuất file chat', included: false },
            { text: 'Hỗ trợ 24/7', included: false },
        ],
        buttonText: 'Đang sử dụng',
        buttonVariant: 'outline',
    },
    {
        id: 'plus',
        name: 'Plus',
        price: '279.000đ',
        priceMonthly: 279000,
        description: 'Phổ biến nhất',
        popular: true,
        features: [
            { text: 'Không giới hạn tin nhắn', included: true },
            { text: 'GPT-4, Claude, Gemini Pro', included: true },
            { text: 'Lưu lịch sử không giới hạn', included: true },
            { text: 'Tất cả AI models', included: true },
            { text: 'Ưu tiên xử lý', included: true },
            { text: 'Xuất file chat', included: true },
            { text: 'Hỗ trợ 24/7', included: false },
        ],
        buttonText: 'Nâng cấp Plus',
        buttonVariant: 'primary',
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '599.000đ',
        priceMonthly: 599000,
        description: 'Dành cho chuyên nghiệp',
        features: [
            { text: 'Mọi tính năng của Plus', included: true },
            { text: 'API Access', included: true },
            { text: 'Custom AI training', included: true },
            { text: 'Team collaboration', included: true },
            { text: 'Priority support 24/7', included: true },
            { text: 'Advanced analytics', included: true },
            { text: 'White-label option', included: true },
        ],
        buttonText: 'Liên hệ tư vấn',
        buttonVariant: 'premium',
    },
];

export default function PricingPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<string>('free');
    const [isLoading, setIsLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        checkAuthAndPlan();
    }, []);

    async function checkAuthAndPlan() {
        try {
            const res = await fetch('/api/me', { credentials: 'include' });
            const data = await res.json();

            if (data.authenticated) {
                setIsAuthenticated(true);
                // Check current plan
                const usageRes = await fetch('/api/usage/check', { credentials: 'include' });
                const usageData = await usageRes.json();
                if (usageData.success) {
                    setCurrentPlan(usageData.data.user.planTier?.toLowerCase() || 'free');
                }
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        }
    }

    async function handleUpgrade(planId: string) {
        if (!isAuthenticated) {
            router.push('/auth/signin?redirect=/pricing');
            return;
        }

        if (planId === 'free' || planId === currentPlan) {
            return;
        }

        if (planId === 'pro') {
            // Redirect to contact form or show modal
            window.open('mailto:sales@example.com?subject=Pro Plan Inquiry', '_blank');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType: planId.toUpperCase() }),
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = data.data.checkoutUrl;
            } else {
                alert('Không thể tạo thanh toán. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/chat" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                            <Sparkles className="w-6 h-6 text-blue-600" />
                            AI Chat
                        </Link>
                        <nav className="flex items-center gap-6">
                            <Link href="/chat" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                Chat
                            </Link>
                            <Link href="/pricing" className="text-blue-600 font-medium">
                                Pricing
                            </Link>
                            {!isAuthenticated ? (
                                <Link
                                    href="/auth/signin"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Đăng nhập
                                </Link>
                            ) : (
                                <Link
                                    href="/chat"
                                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition"
                                >
                                    Quay lại Chat
                                </Link>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-20 pb-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Chọn gói phù hợp với bạn
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Trải nghiệm sức mạnh của AI với các mô hình ngôn ngữ tiên tiến nhất
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`font-medium ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Hàng tháng
            </span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition"
                        >
              <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
                        </button>
                        <span className={`font-medium ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Hàng năm
              <span className="ml-1 text-green-600 text-sm">(tiết kiệm 20%)</span>
            </span>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl p-8 ${
                                    plan.popular
                                        ? 'bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 border-2 border-blue-500 shadow-xl scale-105'
                                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Phổ biến nhất
                    </span>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {plan.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        {plan.description}
                                    </p>
                                    <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {billingCycle === 'yearly' && plan.priceMonthly > 0
                          ? Math.floor(plan.priceMonthly * 0.8).toLocaleString('vi-VN') + 'đ'
                          : plan.price}
                    </span>
                                        {plan.priceMonthly > 0 && (
                                            <span className="ml-2 text-gray-500">/tháng</span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            {feature.included ? (
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <X className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                            )}
                                            <span className={`text-sm ${
                                                feature.included
                                                    ? 'text-gray-700 dark:text-gray-300'
                                                    : 'text-gray-400 dark:text-gray-600'
                                            }`}>
                        {feature.text}
                      </span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={plan.id === currentPlan || isLoading}
                                    className={`w-full py-3 px-6 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                                        plan.buttonVariant === 'primary'
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                                            : plan.buttonVariant === 'premium'
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    } ${plan.id === currentPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {plan.id === currentPlan ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Gói hiện tại
                                        </>
                                    ) : (
                                        <>
                                            {plan.buttonText}
                                            {plan.id !== 'free' && <ArrowRight className="w-4 h-4" />}
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
                        Câu hỏi thường gặp
                    </h2>
                    <div className="space-y-6">
                        {[
                            {
                                q: 'Tôi có thể hủy đăng ký bất cứ lúc nào không?',
                                a: 'Có, bạn có thể hủy gói Plus bất cứ lúc nào. Bạn sẽ tiếp tục sử dụng đến hết chu kỳ thanh toán hiện tại.',
                            },
                            {
                                q: 'Có thể thay đổi gói dịch vụ không?',
                                a: 'Bạn có thể nâng cấp lên gói cao hơn bất cứ lúc nào. Khi hạ cấp, thay đổi sẽ có hiệu lực vào chu kỳ tiếp theo.',
                            },
                            {
                                q: 'Phương thức thanh toán nào được chấp nhận?',
                                a: 'Chúng tôi chấp nhận thanh toán qua Momo, ZaloPay, VNPay và chuyển khoản ngân hàng.',
                            },
                        ].map((faq, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {faq.q}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}